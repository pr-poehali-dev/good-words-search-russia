import json
import os
import psycopg2

SCHEMA = "t_p30280406_good_words_search_ru"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def resp(status, data):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}

def check_auth(body: dict) -> bool:
    phone = (body.get("phone") or "").strip().replace(" ", "")
    password = (body.get("password") or "").strip()
    owner_phone = os.environ.get("OWNER_PHONE", "").strip().replace(" ", "")
    owner_password = os.environ.get("OWNER_PASSWORD", "").strip()
    return phone == owner_phone and password == owner_password

def handler(event: dict, context) -> dict:
    """Панель создателя: логин, управление нарушителями и плохими словами."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    action = body.get("action") or (event.get("queryStringParameters") or {}).get("action", "")

    # --- Логин ---
    if action == "login":
        if check_auth(body):
            return resp(200, {"ok": True, "role": "owner"})
        return resp(403, {"ok": False, "error": "Неверный номер или пароль"})

    # --- Все остальные действия требуют авторизации ---
    if not check_auth(body):
        return resp(403, {"ok": False, "error": "Нет доступа"})

    conn = get_conn()
    cur = conn.cursor()

    # --- Удалить нарушителя ---
    if action == "delete_violator" and method == "DELETE":
        vid = body.get("id")
        cur.execute(f"DELETE FROM {SCHEMA}.violators WHERE id = %s", (vid,))
        conn.commit()
        cur.close(); conn.close()
        return resp(200, {"ok": True})

    # --- Список нарушителей ---
    if action == "list_violators":
        cur.execute(f"SELECT id, bad_word, latitude, longitude, city, ip, created_at FROM {SCHEMA}.violators ORDER BY created_at DESC LIMIT 200")
        rows = cur.fetchall()
        cur.close(); conn.close()
        return resp(200, [{"id": r[0], "bad_word": r[1], "latitude": r[2], "longitude": r[3], "city": r[4], "ip": r[5], "created_at": r[6]} for r in rows])

    # --- Добавить плохое слово ---
    if action == "add_word" and method == "POST":
        word = (body.get("word") or "").strip().lower()
        if not word:
            cur.close(); conn.close()
            return resp(400, {"ok": False, "error": "Слово не указано"})
        cur.execute(f"INSERT INTO {SCHEMA}.custom_bad_words (word) VALUES (%s) ON CONFLICT DO NOTHING", (word,))
        conn.commit()
        cur.close(); conn.close()
        return resp(200, {"ok": True})

    # --- Удалить плохое слово ---
    if action == "delete_word" and method == "DELETE":
        word = (body.get("word") or "").strip().lower()
        cur.execute(f"DELETE FROM {SCHEMA}.custom_bad_words WHERE word = %s", (word,))
        conn.commit()
        cur.close(); conn.close()
        return resp(200, {"ok": True})

    # --- Список кастомных плохих слов ---
    if action == "list_words":
        cur.execute(f"SELECT id, word, added_at FROM {SCHEMA}.custom_bad_words ORDER BY added_at DESC")
        rows = cur.fetchall()
        cur.close(); conn.close()
        return resp(200, [{"id": r[0], "word": r[1], "added_at": r[2]} for r in rows])

    cur.close(); conn.close()
    return resp(400, {"ok": False, "error": "Неизвестное действие"})
