import os
import sys
import numpy as np
import cv2
from PIL import Image

# Ensure backend path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.services.face_service import detect_and_crop_document_face

def test_full_matrix():
    print("\n=======================================================")
    print("      TRUSTID ROBUST FACE ANALYSIS TEST MATRIX        ")
    print("=======================================================\n")

    os.makedirs("test_assets/generated", exist_ok=True)
    os.makedirs("backend/uploads/test_output", exist_ok=True)

    # -------------------------------------------------------------
    # 1. CASE A: Real Passport / ID with portrait
    # -------------------------------------------------------------
    print("--- CASE A: Clear ID Document Portrait ---")
    doc_a = "backend/uploads/documents/TR-2026-0001_doc.jpg"
    crop_a = "backend/uploads/test_output/crop_a.jpg"
    if os.path.exists(doc_a):
        res_a = detect_and_crop_document_face(doc_a, output_crop_path=crop_a)
        print(f"Result: detected={res_a['face_detected']}, crop_avail={res_a['face_crop_available']}, quality={res_a['face_quality']}")
        assert res_a['face_detected'] is True, "Expected face detected"
        assert res_a['face_crop_available'] is True, "Expected crop available"
        assert os.path.exists(crop_a) and os.path.getsize(crop_a) > 0, "Crop file must exist on disk"
        print("[PASS] Case A: Clear document portrait detected and cropped successfully.")

    # -------------------------------------------------------------
    # 2. CASE B: Small Embedded Portrait in High-Res Document
    # -------------------------------------------------------------
    print("\n--- CASE B: Small Embedded Portrait in Large Scan ---")
    doc_b = "backend/uploads/documents/TR-2026-0003_doc.jpg"
    crop_b = "backend/uploads/test_output/crop_b.jpg"
    if os.path.exists(doc_b):
        res_b = detect_and_crop_document_face(doc_b, output_crop_path=crop_b)
        print(f"Result: detected={res_b['face_detected']}, crop_avail={res_b['face_crop_available']}, quality={res_b['face_quality']}")
        assert res_b['face_detected'] is True, "Expected face detected on small embedded portrait"
        assert os.path.exists(crop_b) and os.path.getsize(crop_b) > 0, "Crop file must exist"
        print("[PASS] Case B: Small embedded portrait detected via multi-scale/candidate engine.")

    # -------------------------------------------------------------
    # 3. CASE C: QR Code Only Document (MUST NOT BE DETECTED AS FACE)
    # -------------------------------------------------------------
    print("\n--- CASE C: Document Containing Only QR Code ---")
    qr_doc_path = "test_assets/generated/test_qr_only.jpg"
    qr_img = np.full((600, 800, 3), 245, dtype=np.uint8)
    # Draw QR-like pattern
    cv2.rectangle(qr_img, (50, 50), (750, 550), (50, 50, 50), 2)
    cv2.putText(qr_img, "PAYMENT QR RECEIPT - NO PORTRAIT", (120, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (20, 20, 20), 2)
    # Draw large QR pattern block
    cv2.rectangle(qr_img, (280, 180), (520, 420), (0, 0, 0), -1)
    cv2.rectangle(qr_img, (310, 210), (490, 390), (255, 255, 255), -1)
    cv2.rectangle(qr_img, (340, 240), (460, 360), (0, 0, 0), -1)
    cv2.imwrite(qr_doc_path, qr_img)

    crop_c = "backend/uploads/test_output/crop_c.jpg"
    res_c = detect_and_crop_document_face(qr_doc_path, output_crop_path=crop_c)
    print(f"Result: detected={res_c['face_detected']}, crop_avail={res_c['face_crop_available']}")
    assert res_c['face_detected'] is False, "QR code must NOT be detected as human face"
    assert res_c['crop_path'] is None, "Crop path must be None"
    assert not os.path.exists(crop_c), "No crop image file should be created"
    print("[PASS] Case C: QR code only document correctly identified with NO face.")

    # -------------------------------------------------------------
    # 4. CASE D: Stamp / Seal Only Document (MUST NOT BE DETECTED AS FACE)
    # -------------------------------------------------------------
    print("\n--- CASE D: Document Containing Only Stamp / Seal ---")
    stamp_doc_path = "test_assets/generated/test_stamp_only.jpg"
    stamp_img = np.full((600, 800, 3), 250, dtype=np.uint8)
    cv2.putText(stamp_img, "OFFICIAL NOTARIZED CERTIFICATE", (150, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (20, 20, 20), 2)
    # Draw circular notary seal
    cv2.circle(stamp_img, (400, 300), 100, (180, 40, 40), 5)
    cv2.circle(stamp_img, (400, 300), 85, (180, 40, 40), 2)
    cv2.putText(stamp_img, "SEAL OF NOTARY", (320, 305), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 40, 40), 2)
    cv2.imwrite(stamp_doc_path, stamp_img)

    crop_d = "backend/uploads/test_output/crop_d.jpg"
    res_d = detect_and_crop_document_face(stamp_doc_path, output_crop_path=crop_d)
    print(f"Result: detected={res_d['face_detected']}, crop_avail={res_d['face_crop_available']}")
    assert res_d['face_detected'] is False, "Stamp/seal must NOT be detected as human face"
    assert not os.path.exists(crop_d), "No crop image file should be created"
    print("[PASS] Case D: Stamp/seal only document correctly identified with NO face.")

    # -------------------------------------------------------------
    # 5. CASE E: Signature Only Document
    # -------------------------------------------------------------
    print("\n--- CASE E: Signature / Text Only Document ---")
    sig_doc_path = "test_assets/test_tax_no_face.jpg"
    crop_e = "backend/uploads/test_output/crop_e.jpg"
    res_e = detect_and_crop_document_face(sig_doc_path, output_crop_path=crop_e)
    print(f"Result: detected={res_e['face_detected']}, crop_avail={res_e['face_crop_available']}")
    assert res_e['face_detected'] is False, "Tax document without face must return False"
    print("[PASS] Case E: Document without face rejected with face_detected=False.")

    # -------------------------------------------------------------
    # 6. CASE F: Portrait + QR Code + Stamp in One Document
    # -------------------------------------------------------------
    print("\n--- CASE F: Document Containing Portrait + QR Code + Stamp ---")
    combined_path = "test_assets/generated/test_portrait_plus_qr_stamp.jpg"
    comb_img = np.full((700, 1000, 3), 245, dtype=np.uint8)
    # Add real face crop from sample
    if os.path.exists(doc_a):
        sample_face = cv2.imread(doc_a)
        # Resize to standard ID photo size
        p_crop = cv2.resize(sample_face, (220, 280))
        comb_img[150:430, 80:300] = p_crop
    # Add QR code
    cv2.rectangle(comb_img, (700, 150), (900, 350), (0, 0, 0), -1)
    cv2.rectangle(comb_img, (720, 170), (880, 330), (255, 255, 255), -1)
    cv2.rectangle(comb_img, (750, 200), (850, 300), (0, 0, 0), -1)
    # Add stamp
    cv2.circle(comb_img, (500, 500), 70, (200, 30, 30), 4)
    cv2.putText(comb_img, "VALIDATED", (440, 505), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 30, 30), 2)
    cv2.imwrite(combined_path, comb_img)

    crop_f = "backend/uploads/test_output/crop_f.jpg"
    res_f = detect_and_crop_document_face(combined_path, output_crop_path=crop_f)
    print(f"Result: detected={res_f['face_detected']}, count={res_f['faces_detected_count']}, box={res_f['box']}")
    assert res_f['face_detected'] is True, "Must detect human portrait"
    # Ensure selected box is in the portrait zone (x < 400), NOT in the QR (x > 650) or stamp (x ~ 500, y ~ 500)
    assert res_f['box']['x'] < 400, "Must select human portrait instead of QR code or stamp"
    assert os.path.exists(crop_f), "Portrait crop must exist"
    print("[PASS] Case F: Real human portrait selected, QR code and stamp ignored.")

    # -------------------------------------------------------------
    # 7. CASE G: Multiple Faces in Single Document
    # -------------------------------------------------------------
    print("\n--- CASE G: Multiple Faces in Single Document ---")
    multi_path = "test_assets/generated/test_multi_face.jpg"
    multi_img = np.full((700, 1000, 3), 240, dtype=np.uint8)
    if os.path.exists(doc_a):
        sample_face = cv2.imread(doc_a)
        p1 = cv2.resize(sample_face, (200, 250))
        multi_img[100:350, 80:280] = p1
        multi_img[100:350, 650:850] = p1
    cv2.imwrite(multi_path, multi_img)

    crop_g = "backend/uploads/test_output/crop_g.jpg"
    res_g = detect_and_crop_document_face(multi_path, output_crop_path=crop_g)
    print(f"Result: detected={res_g['face_detected']}, count={res_g['faces_detected_count']}, multiple={res_g['multiple_faces_detected']}")
    assert res_g['face_detected'] is True, "Faces must be detected"
    assert res_g['multiple_faces_detected'] is True or res_g['faces_detected_count'] >= 2, "Must flag multiple faces"
    print("[PASS] Case G: Multiple faces correctly detected and flagged.")

    print("\n=======================================================")
    print("      ALL TEST MATRIX CASES PASSED SUCCESSFULLY!       ")
    print("=======================================================\n")

if __name__ == "__main__":
    test_full_matrix()
