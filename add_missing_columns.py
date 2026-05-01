import pymysql
from pymysql import cursors

# Kết nối đến database
connection = pymysql.connect(
    host='localhost',
    port=3308,
    user='root',
    password='12345',
    database='pbl7',
    cursorclass=cursors.DictCursor
)

try:
    with connection.cursor() as cursor:
        # Kiểm tra và thêm cột avatar_path nếu chưa có
        try:
            cursor.execute("ALTER TABLE infor_user ADD COLUMN avatar_path VARCHAR(255)")
            connection.commit()
            print("✓ Đã thêm cột avatar_path")
        except pymysql.Error as e:
            if "Duplicate column name" in str(e):
                print("✓ Cột avatar_path đã tồn tại")
            else:
                raise

        # Kiểm tra và thêm cột age nếu chưa có
        try:
            cursor.execute("ALTER TABLE infor_user ADD COLUMN age INT")
            connection.commit()
            print("✓ Đã thêm cột age")
        except pymysql.Error as e:
            if "Duplicate column name" in str(e):
                print("✓ Cột age đã tồn tại")
            else:
                raise

        # Kiểm tra và thêm cột gender nếu chưa có
        try:
            cursor.execute("ALTER TABLE infor_user ADD COLUMN gender VARCHAR(50)")
            connection.commit()
            print("✓ Đã thêm cột gender")
        except pymysql.Error as e:
            if "Duplicate column name" in str(e):
                print("✓ Cột gender đã tồn tại")
            else:
                raise

        # Kiểm tra và thêm cột marriage nếu chưa có
        try:
            cursor.execute("ALTER TABLE infor_user ADD COLUMN marriage VARCHAR(100)")
            connection.commit()
            print("✓ Đã thêm cột marriage")
        except pymysql.Error as e:
            if "Duplicate column name" in str(e):
                print("✓ Cột marriage đã tồn tại")
            else:
                raise

        # Kiểm tra và thêm cột degree nếu chưa có
        try:
            cursor.execute("ALTER TABLE infor_user ADD COLUMN degree TEXT")
            connection.commit()
            print("✓ Đã thêm cột degree")
        except pymysql.Error as e:
            if "Duplicate column name" in str(e):
                print("✓ Cột degree đã tồn tại")
            else:
                raise

        print("\n✓ Đã cập nhật database xong!")

finally:
    connection.close()
