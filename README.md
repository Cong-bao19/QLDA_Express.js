# Login Backend API

Backend API xác thực người dùng, xây dựng bằng Express.js và MySQL, triển khai trên AWS EC2 với SSL tự ký và PM2.

## Tính năng
- Xác thực người dùng với session.
- Lưu trữ dữ liệu trong MySQL.
- HTTPS với chứng chỉ tự ký cho public IP.
- Chạy liên tục với PM2 trên AWS EC2.

## Công nghệ
- **Backend**: Express.js, Node.js
- **Database**: MySQL 8.0.42
- **Triển khai**: AWS EC2 (Ubuntu 24.04), Git, PM2, Nginx, OpenSSL
- **Công cụ**: WSL, AWS Console, AWS CLI

## Yêu cầu
- AWS EC2 instance (public IP: 52.73.54.52, t2.micro).
- Node.js (LTS), MySQL, Git, PM2, Nginx, OpenSSL.
- Tài khoản GitHub và AWS Free Tier.

## Cấu trúc dự án
```
QLDA_Express.js/
├── docs/
│   └── deployment.md
├── routes/
│   └── api.js
├── tests/
│   └── api.test.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── server.js
└── db.sql (lưu cục bộ)
```

## API Endpoints
- `GET /`: Trả về thông điệp chào mừng (`"Welcome to Login Backend API!"`).
- `GET /api/login`: Đăng nhập (`{ message: "Login endpoint" }`).
- `GET /api/users`: Danh sách người dùng (`{ message: "List users" }`).

## Thiết lập

### 1. Khởi tạo và cấu hình EC2
- Tạo instance EC2 (t2.micro, Ubuntu 24.04) với VPC tự tạo.
- Tải file khóa riêng (`nodejs-key.pem`).
- Associate Elastic IP (tùy chọn, lưu ý phí nếu không dùng).
- Cấu hình **Security Group**:
  - Inbound rules:
    - Port 22 (SSH): `0.0.0.0/0` hoặc IP của bạn.
    - Port 80 (HTTP): `0.0.0.0/0`.
    - Port 443 (HTTPS): `0.0.0.0/0`.
    - Port 3000 (Express.js): `0.0.0.0/0` (tạm thời, xóa sau khi dùng Nginx).

### 2. Kết nối instance qua SSH (WSL trên Windows)
```bash
# Vào WSL
wsl

# Tạo thư mục .ssh
mkdir -p ~/.ssh

# Chuyển file khóa
cp /mnt/c/Users/ADMIN/Downloads/nodejs-key.pem ~/.ssh/

# Đổi quyền file khóa
chmod 400 ~/.ssh/nodejs-key.pem
ls -l ~/.ssh/nodejs-key.pem

# SSH tới EC2
ssh -i ~/.ssh/nodejs-key.pem ubuntu@52.73.54.52
```

### 3. Clone repository
```bash
git clone https://github.com/Cong-bao19/QLDA_Express.js.git
cd QLDA_Express.js
```

### 4. Cài đặt NVM
```bash
sudo apt update
sudo apt upgrade
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm --version
```

### 5. Cài đặt Node.js
```bash
nvm install --lts
node -v
npm -v
```

### 6. Cài đặt MySQL
```bash
sudo apt install mysql-server
sudo systemctl status mysql
sudo mysql
```
```sql
CREATE DATABASE login_db;
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON login_db.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
- Chuyển và nhập file `db.sql`:
```bash
scp -i ~/.ssh/nodejs-key.pem /mnt/c/Users/ADMIN/Downloads/db.sql ubuntu@52.73.54.52:/home/ubuntu/db.sql
mysql -u app_user -p login_db < /home/ubuntu/db.sql
```
- Kiểm tra:
```bash
mysql -u app_user -p
USE login_db;
SHOW TABLES;
EXIT;
```

### 7. Cấu hình ứng dụng Node.js
```bash
cd /home/ubuntu/QLDA_Express.js
cp .env.example .env
nano .env
```
- Nội dung `.env`:
```
PORT=3000
BCRYPT_SALT_ROUNDS=10
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=your_password
DB_NAME=login_db
```
```bash
chmod 600 .env
npm install
npm start
```
- Kiểm tra: Truy cập `http://52.73.54.52:3000` trên trình duyệt.

### 8. Cài đặt và sử dụng PM2
```bash
npm install -g pm2
pm2 start server.js --name login-backend
pm2 status
pm2 save
pm2 startup
curl http://localhost:3000/api/login
```

### 9. Triển khai SSL với public IP
```bash
sudo apt install openssl
sudo mkdir -p /etc/ssl/selfsigned
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/selfsigned/selfsigned.key \
  -out /etc/ssl/selfsigned/selfsigned.crt
```
- **Common Name (CN)**: `52.73.54.52`.
```bash
ls -l /etc/ssl/selfsigned
sudo chmod 600 /etc/ssl/selfsigned/*
sudo chown www-data:www-data /etc/ssl/selfsigned/*
```

### 10. Cài đặt và cấu hình Nginx
```bash
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo nano /etc/nginx/sites-available/login-backend
```
- Nội dung:
```nginx
server {
    listen 80;
    server_name 52.73.54.52;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name 52.73.54.52;
    ssl_certificate /etc/ssl/selfsigned/selfsigned.crt;
    ssl_certificate_key /etc/ssl/selfsigned/selfsigned.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/login-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

- **Khắc phục lỗi Nginx (`cannot load certificate`)**:
  - Nếu `sudo nginx -t` báo lỗi:
    ```bash
    ls -l /etc/ssl/selfsigned
    ```
    - Đảm bảo `selfsigned.crt` và `selfsigned.key` tồn tại.
    - Nếu không, tạo lại chứng chỉ (bước 9).
    - Kiểm tra quyền:
      ```bash
      sudo chmod 600 /etc/ssl/selfsigned/*
      sudo chown www-data:www-data /etc/ssl/selfsigned/*
      ```

- Cập nhật **Security Group**:
  - Xóa Port 3000.
  - Đảm bảo Port 80 (HTTP) và 443 (HTTPS) mở cho `0.0.0.0/0`.

- Kiểm tra HTTPS:
```bash
curl -k https://52.73.54.52/api/login
```
- Trình duyệt: `https://52.73.54.52`. Nhấp **Advanced** > **Proceed** để vượt cảnh báo.

### 11. Quản lý chi phí
- Dừng instance:
```bash
aws ec2 describe-instances --query 'Reservations[].Instances[?PublicIpAddress==`52.73.54.52`].[InstanceId]' --output text
aws ec2 stop-instances --instance-ids i-xxx
```
- Hoặc: AWS Console > **EC2** > **Instances** > **Actions** > **Stop instance**.
- Xóa Elastic IP:
  - AWS Console > **EC2** > **Elastic IPs** > Chọn IP > **Actions** > **Disassociate** > **Release**.

## Lưu ý
- Chứng chỉ tự ký gây cảnh báo “Not Secure” trên trình duyệt, chỉ dùng cho test. Trong production, dùng Let’s Encrypt với tên miền.
- Nếu public IP thay đổi (do dừng instance), tạo lại chứng chỉ với IP mới.
- Không đẩy `.env`, `db.sql`, `nodejs-key.pem`, `/etc/ssl/selfsigned/` lên GitHub.
- Kiểm tra chi phí AWS Free Tier trong **Billing Dashboard**.

## Tài liệu bổ sung
- Xem `docs/deployment.md` để biết chi tiết triển khai.

## Giấy phép
MIT

## Liên hệ
- GitHub: [Cong-bao19](https://github.com/Cong-bao19)
