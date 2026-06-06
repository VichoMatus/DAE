from app import app
from seed_data import seed_database


def main():
    with app.app_context():
        seed_database()
    print("Base de datos inicializada con éxito")


if __name__ == "__main__":
    main()
