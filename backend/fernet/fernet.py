from cryptography.fernet import Fernet
key = Fernet.generate_key()
print(key.decode())  # Save this value for use in your .env