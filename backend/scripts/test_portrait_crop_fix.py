import os
import sys
import numpy as np
import cv2
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.services.face_service import (
    detect_and_crop_document_face,
    analyze_photo_authenticity,
    _detect_faces_yunet,
    _detect_faces_rfb,
    _is_qr_or_barcode
)

def test_portrait_extraction_rules():
    print("================================================================")
    print("      TESTING TRUSTID FACE CROPPING & PORTRAIT VALIDATION      ")
    print("================================================================")

    os.makedirs("test_assets/generated", exist_ok=True)
    os.makedirs("backend/uploads/test_output", exist_ok=True)

    # 1. Real passport with portrait (TR-2026-0001_doc.jpg)
    doc_real = "backend/uploads/documents/TR-2026-0001_doc.jpg"
    crop_out = "backend/uploads/test_output/test_real_crop.jpg"
    if os.path.exists(doc_real):
        res = detect_and_crop_document_face(doc_real, output_crop_path=crop_out)
        print(f"\n[TEST 1] Real Passport: face_detected={res['face_detected']}, crop_avail={res['face_crop_available']}")
        assert res['face_detected'] is True
        assert res['face_crop_available'] is True
        assert res['primary_portrait_face_count'] == 1
        assert os.path.exists(crop_out)
        
        # Verify the saved crop ACTUALLY has a human face
        crop_img = cv2.imread(crop_out)
        crop_faces = _detect_faces_yunet(crop_img) or _detect_faces_rfb(crop_img)
        assert len(crop_faces) > 0, "Cropped image MUST contain a human face!"
        print("  -> Verified: Saved crop contains confirmed human face.")

    # 2. Aadhaar sample if present
    doc_aadhaar = "test_assets/uploaded_aadhaar_sample.jpg"
    if os.path.exists(doc_aadhaar):
        crop_aadhaar = "backend/uploads/test_output/test_aadhaar_crop.jpg"
        res_a = detect_and_crop_document_face(doc_aadhaar, output_crop_path=crop_aadhaar)
        print(f"\n[TEST 2] Aadhaar Scan: face_detected={res_a['face_detected']}, crop_avail={res_a['face_crop_available']}")
        if res_a['face_detected']:
            assert res_a['face_crop_available'] is True
            assert os.path.exists(crop_aadhaar)
            crop_img = cv2.imread(crop_aadhaar)
            crop_faces = _detect_faces_yunet(crop_img) or _detect_faces_rfb(crop_img)
            assert len(crop_faces) > 0
            print("  -> Verified: Aadhaar portrait crop contains confirmed human face.")

    # 3. Document with QR code and NO face
    qr_path = "test_assets/generated/test_qr_strict.jpg"
    qr_img = np.full((600, 800, 3), 245, dtype=np.uint8)
    cv2.rectangle(qr_img, (100, 100), (350, 350), (0, 0, 0), -1)
    cv2.rectangle(qr_img, (130, 130), (320, 320), (255, 255, 255), -1)
    cv2.rectangle(qr_img, (160, 160), (290, 290), (0, 0, 0), -1)
    cv2.imwrite(qr_path, qr_img)
    crop_qr = "backend/uploads/test_output/test_qr_crop.jpg"
    res_qr = detect_and_crop_document_face(qr_path, output_crop_path=crop_qr)
    print(f"\n[TEST 3] Pure QR Code: face_detected={res_qr['face_detected']}, crop_avail={res_qr['face_crop_available']}")
    assert res_qr['face_detected'] is False
    assert res_qr['face_crop_available'] is False
    assert not os.path.exists(crop_qr)
    print("  -> Verified: QR code was correctly rejected and not cropped.")

    # 4. Document with Seal/Stamp and NO face
    stamp_path = "test_assets/generated/test_stamp_strict.jpg"
    stamp_img = np.full((600, 800, 3), 250, dtype=np.uint8)
    cv2.circle(stamp_img, (300, 300), 90, (180, 40, 40), 6)
    cv2.putText(stamp_img, "OFFICIAL", (240, 305), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (180, 40, 40), 2)
    cv2.imwrite(stamp_path, stamp_img)
    crop_stamp = "backend/uploads/test_output/test_stamp_crop.jpg"
    res_stamp = detect_and_crop_document_face(stamp_path, output_crop_path=crop_stamp)
    print(f"\n[TEST 4] Pure Seal/Stamp: face_detected={res_stamp['face_detected']}, crop_avail={res_stamp['face_crop_available']}")
    assert res_stamp['face_detected'] is False
    assert res_stamp['face_crop_available'] is False
    assert not os.path.exists(crop_stamp)
    print("  -> Verified: Seal/Stamp was correctly rejected and not cropped.")

    # 5. Document with simulated non-face candidate box passed from AI
    # Pass a candidate box pointing at the stamp in a document that has a real portrait elsewhere
    doc_mixed = "test_assets/generated/test_portrait_plus_qr_stamp.jpg"
    if os.path.exists(doc_mixed):
        # AI candidate box pointing at the stamp area (x: 430-570, y: 430-570)
        bogus_ai_box = [0.6, 0.43, 0.8, 0.57]
        crop_mixed = "backend/uploads/test_output/test_mixed_crop.jpg"
        res_m = detect_and_crop_document_face(doc_mixed, normalized_box=bogus_ai_box, output_crop_path=crop_mixed)
        print(f"\n[TEST 5] Mixed Document with Bogus AI Box pointing at stamp: face_detected={res_m['face_detected']}")
        assert res_m['face_detected'] is True
        # Ensure the selected box is around the real human face (x < 400), not the stamp
        assert res_m['box']['x'] < 400, "Must select real human face, NOT the bogus AI box on the stamp!"
        crop_img = cv2.imread(crop_mixed)
        crop_faces = _detect_faces_yunet(crop_img) or _detect_faces_rfb(crop_img)
        assert len(crop_faces) > 0, "The resulting crop must be the validated human face!"
        print("  -> Verified: System ignored bogus AI box on stamp and accurately extracted the real human face.")

    print("\n================================================================")
    print("      ALL PORTRAIT CROPPING AND VALIDATION TESTS PASSED!       ")
    print("================================================================")

if __name__ == "__main__":
    test_portrait_extraction_rules()
