import hashlib
import pymysql
from datetime import datetime

DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = ""
DB_NAME = "pbl7"
DB_PORT = 3306


def hash_password(raw_password):
    return hashlib.sha256(raw_password.encode("utf-8")).hexdigest()


def main():
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=DB_PORT,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS admin (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) NOT NULL UNIQUE,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    display_name VARCHAR(100) NOT NULL DEFAULT 'Quản trị viên',
                    password VARCHAR(64) NOT NULL,
                    avatar_path VARCHAR(255),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX ix_admin_username (username),
                    INDEX ix_admin_is_active (is_active),
                    INDEX ix_admin_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            admins = [
                {
                    "username": "admin",
                    "email": "admin@local.test",
                    "display_name": "Quản trị viên",
                    "password": "admin123",
                    "avatar_path": "/admin/avatar/file/admin-avatar.jpg",
                }
            ]

            for admin in admins:
                hashed_password = hash_password(admin["password"])

                cursor.execute("""
                    INSERT INTO admin (
                        username, email, display_name, password, avatar_path, is_active, created_at, updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, TRUE, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        display_name = VALUES(display_name),
                        password = VALUES(password),
                        avatar_path = VALUES(avatar_path),
                        is_active = TRUE,
                        updated_at = VALUES(updated_at);
                """, (
                    admin["username"],
                    admin["email"],
                    admin["display_name"],
                    hashed_password,
                    admin["avatar_path"],
                    datetime.now(),
                    datetime.now(),
                ))

        connection.commit()
        print("Import admin thành công.")

    except Exception as e:
        connection.rollback()
        print("Lỗi import admin:", e)

    finally:
        connection.close()


if __name__ == "__main__":
    main()