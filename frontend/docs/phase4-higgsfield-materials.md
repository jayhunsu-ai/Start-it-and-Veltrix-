# Phase 4 — Higgsfield Material References

These are the four Higgsfield-generated references used as the visual targets for the Three.js material system.

- Denim: https://d8j0ntlcm91z4.cloudfront.net/user_3ISPPAbTN1NAmrtXlvreblNTgGK/hf_20260826_164938_489c0a11-fbc2-4428-86d8-6d5a4d9352c9.png
- Blueprint: https://d8j0ntlcm91z4.cloudfront.net/user_3ISPPAbTN1NAmrtXlvreblNTgGK/hf_20260826_164938_78ac2de7-805a-4908-a158-af7ab0a20331.png
- Paper: https://d8j0ntlcm91z4.cloudfront.net/user_3ISPPAbTN1NAmrtXlvreblNTgGK/hf_20260826_164938_2e38d08a-979a-4d1b-bb19-621ae1a935a2.png
- Pencil: https://d8j0ntlcm91z4.cloudfront.net/user_3ISPPAbTN1NAmrtXlvreblNTgGK/hf_20260826_164938_717302ca-f7e2-4fe5-9f37-d86f1bbbffb8.png

Also mirrored locally at `frontend/public/materials/{denim,blueprint,paper,pencil}.png`.

Implementation direction:
- real WebGL / Three.js geometry
- bevelled physical plates
- layered inset faces
- visible fasteners
- concentric mechanical core
- live exploded assembly
- drag-to-rotate
- procedural PBR surfaces driven by the Higgsfield references
