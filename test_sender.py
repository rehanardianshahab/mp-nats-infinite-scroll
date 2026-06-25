"""
Simulator CLI untuk mengirim notifikasi ke sistem.

Cara pakai:
  python test_sender.py

Pastikan backend FastAPI sudah berjalan di http://localhost:8000
"""

import sys
from typing import Optional

import requests

API_URL = "http://localhost:8000"


def send_notification(
    user_email: str,
    sender_name: str,
    notif_type: str,
    message: str,
) -> Optional[dict]:
    payload = {
        "user_email": user_email,
        "sender_name": sender_name,
        "type": notif_type,
        "message": message,
    }
    try:
        resp = requests.post(
            f"{API_URL}/api/notifications/trigger",
            json=payload,
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.ConnectionError:
        print(f"[!] Gagal koneksi ke {API_URL}. Pastikan backend berjalan.")
        return None
    except requests.exceptions.RequestException as e:
        print(f"[!] Error: {e}")
        return None


def option_auto(sender_name: str, notif_type: str) -> None:
    result = send_notification(
        user_email="user2@example.com",
        sender_name=sender_name,
        notif_type=notif_type,
        message=f"Notifikasi otomatis: {notif_type} oleh {sender_name}.",
    )
    if result:
        print(f"[✓] Terkirim (id={result['id']})")


def option_manual() -> None:
    print("\n--- Input Manual ---")
    sender_name = input("Nama Pengirim   : ").strip()
    notif_type = input("Tipe Notifikasi  : ").strip()
    message = input("Isi Pesan        : ").strip()
    user_email = input("Email Penerima   : ").strip()

    if not all([sender_name, notif_type, message, user_email]):
        print("[!] Semua field harus diisi.")
        return

    result = send_notification(
        user_email=user_email,
        sender_name=sender_name,
        notif_type=notif_type,
        message=message,
    )
    if result:
        print(f"[✓] Terkirim (id={result['id']})")


def main() -> None:
    print("=" * 50)
    print("  SIMULATOR NOTIFIKASI REAL-TIME")
    print("=" * 50)

    while True:
        print("\nPilih opsi:")
        print("  1. User 1 (Manager)   → user2@example.com  [Usulan Disetujui]")
        print("  2. User 1 (Reviewer)  → user2@example.com  [Usulan Perlu Revisi]")
        print("  3. Input Manual")
        print("  4. Keluar")
        pilihan = input("\nOpsi [1-4]: ").strip()

        if pilihan == "1":
            option_auto("User 1 (Manager)", "Usulan Disetujui")
        elif pilihan == "2":
            option_auto("User 1 (Reviewer)", "Usulan Perlu Revisi")
        elif pilihan == "3":
            option_manual()
        elif pilihan == "4":
            print("Keluar. Sampai jumpa!")
            break
        else:
            print("[!] Opsi tidak valid.")


if __name__ == "__main__":
    main()
