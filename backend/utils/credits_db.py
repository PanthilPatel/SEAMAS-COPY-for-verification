import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'credits.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_credits (
            user_id TEXT PRIMARY KEY,
            tier TEXT DEFAULT 'free',
            credits INTEGER DEFAULT 50
        )
    ''')
    conn.commit()
    conn.close()

def get_credits(user_id: str) -> dict:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT tier, credits FROM user_credits WHERE user_id = ?', (user_id,))
    row = cursor.fetchone()
    
    if not row:
        # Initialize new user with 50 credits
        cursor.execute('INSERT INTO user_credits (user_id, tier, credits) VALUES (?, ?, ?)', (user_id, 'free', 50))
        conn.commit()
        conn.close()
        return {'tier': 'free', 'credits': 50}
        
    conn.close()
    return {'tier': row[0], 'credits': row[1]}

def deduct_credit(user_id: str, amount: int = 1) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT tier, credits FROM user_credits WHERE user_id = ?', (user_id,))
    row = cursor.fetchone()
    if not row:
        # Implicitly create for guests/new users and deduct
        cursor.execute('INSERT INTO user_credits (user_id, tier, credits) VALUES (?, ?, ?)', (user_id, 'free', max(0, 50 - amount)))
        conn.commit()
        conn.close()
        return True

    if row[1] >= amount:
        cursor.execute('UPDATE user_credits SET credits = credits - ? WHERE user_id = ?', (amount, user_id))
        conn.commit()
        conn.close()
        return True
        
    conn.close()
    return False

def upgrade_to_pro(user_id: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO user_credits (user_id, tier, credits) 
        VALUES (?, 'pro', 5000)
        ON CONFLICT(user_id) DO UPDATE SET tier = 'pro', credits = 5000
    ''', (user_id,))
    conn.commit()
    conn.close()

init_db()
