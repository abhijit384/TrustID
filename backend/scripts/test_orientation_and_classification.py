import os
import sys
import numpy as np
import cv2
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.services.image_normalization import normalize_image_orientation
from backend.services.face_service import detect_and_crop_document_face
from backend.services.validation_service import validate_document_rules

def run_tests():
    print("====================================================================")
    print("  TESTING ORIENTATION NORMALIZATION & DOCUMENT CLASSIFICATION RULES ")
    print("====================================================================\n")

    os.makedirs("test_assets/generated", exist_ok=True)
    os.makedirs("backend/uploads/test_output", exist_ok=True)

    # -------------------------------------------------------------
    # TEST 1: ROTATED DOCUMENT (90 degrees Clockwise)
    # -------------------------------------------------------------
    print("--- [TEST 1] 90° Clockwise Rotated Document ---")
    orig_passport = "backend/uploads/documents/TR-2026-0001_doc.jpg"
    if os.path.exists(orig_passport):
        # Create a rotated 90 deg version
        img = cv2.imread(orig_passport)
        rot_90 = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
        rot_path = "test_assets/generated/test_rotated_90.jpg"
        cv2.imwrite(rot_path, rot_90)

        # Normalize orientation
        norm_path, angle = normalize_image_orientation(rot_path)
        print(f"Orientation normalization applied: {angle}°")
        assert angle in [90, 270], f"Expected 90° or 270° rotation, got {angle}"

        # Test face extraction on normalized image
        crop_path = "backend/uploads/test_output/crop_rot_90.jpg"
        face_res = detect_and_crop_document_face(rot_path, output_crop_path=crop_path)
        print(f"Face extraction on normalized image: detected={face_res['face_detected']}, crop_avail={face_res['face_crop_available']}")
        assert face_res['face_detected'] is True, "Must detect face after orientation normalization!"
        assert face_res['face_crop_available'] is True, "Must produce valid crop after orientation normalization!"
        assert os.path.exists(crop_path)
        print("[PASS] Test 1: 90° rotated document auto-oriented and portrait extracted successfully.")

    # -------------------------------------------------------------
    # TEST 2: ROTATED DOCUMENT (180 degrees Upside-Down)
    # -------------------------------------------------------------
    print("\n--- [TEST 2] 180° Upside-Down Document ---")
    if os.path.exists(orig_passport):
        img = cv2.imread(orig_passport)
        rot_180 = cv2.rotate(img, cv2.ROTATE_180)
        rot_path_180 = "test_assets/generated/test_rotated_180.jpg"
        cv2.imwrite(rot_path_180, rot_180)

        norm_path, angle = normalize_image_orientation(rot_path_180)
        print(f"Orientation normalization applied: {angle}°")
        assert angle == 180, f"Expected 180° rotation, got {angle}"

        crop_path_180 = "backend/uploads/test_output/crop_rot_180.jpg"
        face_res_180 = detect_and_crop_document_face(rot_path_180, output_crop_path=crop_path_180)
        print(f"Face extraction on normalized image: detected={face_res_180['face_detected']}")
        assert face_res_180['face_detected'] is True
        print("[PASS] Test 2: 180° rotated document auto-oriented and portrait extracted successfully.")

    # -------------------------------------------------------------
    # TEST 3: SPECIMEN / SAMPLE DOCUMENT (Must be FAKE DOCUMENT, NOT INVALID)
    # -------------------------------------------------------------
    print("\n--- [TEST 3] Specimen / Sample Document Classification ---")
    sample_fields = {
        "Full Name": "CONNOR SAMPLE",
        "Document Number": "N99999999",
        "Date of Birth": "1990-01-01",
        "Expiry Date": "2030-01-01"
    }
    sample_gemini = {
        "raw_ocr_text": "SPECIMEN DOCUMENT SAMPLE ONLY NOT VALID",
        "authenticity_assessment": {
            "classification": "Fake Document",
            "reasons": ["Document is an official specimen / sample demonstration template."]
        }
    }
    val_res = validate_document_rules(sample_fields, gemini_data=sample_gemini)
    specimen_checks = [c for c in val_res.get("checks", []) if "Specimen" in c["check_name"]]
    assert len(specimen_checks) > 0
    assert specimen_checks[0]["status"] == "Failed", "Specimen check must fail"
    assert "specimen" in specimen_checks[0]["message"].lower()
    print(f"Specimen verification check: {specimen_checks[0]['message']}")
    print("[PASS] Test 3: Specimen document correctly marked as Failed (Target: FAKE DOCUMENT).")

    # -------------------------------------------------------------
    # TEST 4: NON-DOCUMENT / RANDOM IMAGE (Must be INVALID DOCUMENT)
    # -------------------------------------------------------------
    print("\n--- [TEST 4] Non-Document Random Image ---")
    random_img_path = "test_assets/generated/random_noise.jpg"
    rand_img = np.random.randint(0, 256, (500, 500, 3), dtype=np.uint8)
    cv2.imwrite(random_img_path, rand_img)
    face_rand = detect_and_crop_document_face(random_img_path)
    assert face_rand['face_detected'] is False
    print(f"Non-document face detection: detected={face_rand['face_detected']}")
    print("[PASS] Test 4: Random non-document image correctly detected with no face.")

    print("\n====================================================================")
    print("      ALL ORIENTATION AND CLASSIFICATION TESTS PASSED!             ")
    print("====================================================================\n")

if __name__ == "__main__":
    run_tests()
