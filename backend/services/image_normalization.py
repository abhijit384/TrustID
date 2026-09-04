import os
import logging
from typing import Tuple, Optional
import cv2
import numpy as np
from PIL import Image, ImageOps
from backend.services.memory_utils import log_memory, force_gc

logger = logging.getLogger(__name__)

def _detect_upright_face_confidence(img_bgr: np.ndarray) -> float:
    """Returns the highest confidence of an upright human face with valid landmarks in the given image."""
    from backend.services.face_service import _detect_faces_yunet, _detect_faces_rfb
    faces_yu = _detect_faces_yunet(img_bgr, score_thresh=0.30)
    if faces_yu:
        return max(f[0] for f in faces_yu)
    faces_rfb = _detect_faces_rfb(img_bgr, conf_thresh=0.72)
    if faces_rfb:
        return max(f[0] for f in faces_rfb)
    return 0.0

def _score_text_orientation(img_bgr: np.ndarray) -> float:
    """Computes horizontal-to-vertical gradient ratio (horizontal text produces strong vertical gradient)."""
    try:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape[:2]
        if max(h, w) > 600:
            scale = 600.0 / max(h, w)
            gray = cv2.resize(gray, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        
        # Horizontal lines (text rows) create strong dy derivative (Sobel Y)
        sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        var_y = np.var(sobel_y)
        var_x = np.var(sobel_x)
        return float(var_y / max(1.0, var_x))
    except Exception:
        return 1.0

def normalize_image_orientation(image_path: str) -> Tuple[str, int]:
    """
    Normalizes document image orientation before any subsequent analysis (OCR, layout, face detection).
    1. Performs EXIF orientation correction.
    2. Evaluates 0°, 90° CW, 180°, 270° CW rotations using facial detection and text layout heuristics.
    3. Rotates image to upright orientation and overwrites image_path.
    Returns (image_path, applied_rotation_degrees).
    """
    if not os.path.exists(image_path):
        return image_path, 0

    log_memory("before_orientation_norm", os.path.basename(image_path))
    applied_rotation = 0

    try:
        # 1. EXIF Transpose
        with Image.open(image_path) as pil_raw:
            pil_img = ImageOps.exif_transpose(pil_raw)
            if pil_img is None:
                pil_img = pil_raw
            pil_img = pil_img.convert("RGB")
            
            # Limit dimension for fast orientation testing
            w_orig, h_orig = pil_img.size
            if max(w_orig, h_orig) > 1200:
                pil_img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
            
            img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        # 2. Fast-path check: Is the image already upright (0°)?
        f0 = _detect_upright_face_confidence(img_bgr)
        t0 = _score_text_orientation(img_bgr)

        best_angle = 0
        if f0 >= 0.60:
            # Face found upright at 0° with high confidence: no rotation needed!
            best_angle = 0
            logger.info(f"[ORIENTATION] Upright orientation verified at 0° (face conf: {f0:.2f})")
        else:
            # Test other angles: 90° CW, 180°, 270° CW
            rot_imgs = {
                0: img_bgr,
                90: cv2.rotate(img_bgr, cv2.ROTATE_90_CLOCKWISE),
                180: cv2.rotate(img_bgr, cv2.ROTATE_180),
                270: cv2.rotate(img_bgr, cv2.ROTATE_90_COUNTERCLOCKWISE)
            }

            face_scores = {0: f0}
            text_scores = {0: t0}

            for ang in [90, 180, 270]:
                r_img = rot_imgs[ang]
                face_scores[ang] = _detect_upright_face_confidence(r_img)
                text_scores[ang] = _score_text_orientation(r_img)

            max_face_score = max(face_scores.values())

            if max_face_score >= 0.40:
                best_angle = max(face_scores.items(), key=lambda x: x[1])[0]
                logger.info(f"[ORIENTATION] Best orientation determined by facial detection: {best_angle}° (conf: {max_face_score:.2f})")
            else:
                landscape_angles = [ang for ang in [0, 180] if rot_imgs[ang].shape[1] >= rot_imgs[ang].shape[0]]
                if landscape_angles and not (rot_imgs[0].shape[1] >= rot_imgs[0].shape[0]):
                    best_angle = 90 if text_scores.get(90, 0) >= text_scores.get(270, 0) else 270
                else:
                    best_angle = max(text_scores.items(), key=lambda x: x[1])[0]
                logger.info(f"[ORIENTATION] Orientation determined by text layout: {best_angle}°")

            del rot_imgs

        if best_angle != 0:
            applied_rotation = best_angle
            # Apply to full original image
            with Image.open(image_path) as full_raw:
                full_trans = ImageOps.exif_transpose(full_raw)
                if full_trans is None:
                    full_trans = full_raw
                full_rgb = full_trans.convert("RGB")
                
                if best_angle == 90:
                    rotated = full_rgb.rotate(270, expand=True) # 90 CW in PIL is 270 CCW
                elif best_angle == 180:
                    rotated = full_rgb.rotate(180, expand=True)
                elif best_angle == 270:
                    rotated = full_rgb.rotate(90, expand=True)
                else:
                    rotated = full_rgb

                rotated.save(image_path, format="JPEG", quality=95)
                rotated.close()
                full_rgb.close()
            logger.info(f"[ORIENTATION] Successfully normalized image orientation by {best_angle}° -> {image_path}")

        if 'rot_imgs' in locals():
            del rot_imgs
        if 'img_bgr' in locals():
            del img_bgr
        force_gc()
        return image_path, applied_rotation

    except Exception as e:
        logger.warning(f"[ORIENTATION] Note on image normalization: {e}")
        force_gc()
        return image_path, 0
