# Masa Rezervasyon Sistemi

Şirket içinde günlük masa rezervasyonu yapmak için geliştirilen NestJS, Prisma ve PostgreSQL API’si. Kullanıcılar şirket e-postalarıyla kayıt olur, giriş yaparak JWT alır ve rezervasyon işlemlerini bu JWT ile yapar.

Frontend entegrasyon sözleşmesi: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## İş kuralları

- Sistemde 1–32 arasında 32 masa bulunur.
- Yalnız `COMPANY_EMAIL_DOMAIN` ile belirtilen şirket e-posta uzantısı kabul edilir.
- Bir kullanıcı aynı gün yalnız bir aktif masa ayırabilir.
- Bir masa aynı gün yalnız bir aktif kullanıcı tarafından ayrılabilir.
- Aynı anda gelen çakışan isteklerden yalnız veritabanına ilk ulaşan başarılı olur; diğeri `409 Conflict` alır.
- Rezervasyon bugün ile `MAX_RESERVATION_DAYS_AHEAD` gün sonrası arasına yapılabilir.
- Kullanıcı yalnız kendi aktif rezervasyonlarını görebilir.
- Bugünkü ve gelecekteki aktif rezervasyonların tarihi ve masası değiştirilebilir.
- Rezervasyonlar fiziksel olarak silinmez; iptal bilgisiyle geçmişte saklanır.
- Rezervasyon iptal edilince masa aynı gün için yeniden alınabilir.
- Rezervasyon kodu veya yönetim token’ı kullanılmaz; sahiplik JWT’deki kullanıcı kimliğiyle belirlenir.

## Kurulum

Gereksinimler: Node.js, npm ve PostgreSQL. PostgreSQL’i Podman, Docker veya yerel kurulumla çalıştırabilirsiniz.

1. PostgreSQL’i başlatın. Docker kullanıyorsanız proje kökünde:

   ```powershell
   docker compose up -d
   ```

2. `backend/.env` dosyasında normal ve test veritabanı bağlantılarını ayarlayın. Özellikle `DATABASE_URL`, `TEST_DATABASE_URL`, `TEST_DATABASE_ADMIN_URL`, `COMPANY_EMAIL_DOMAIN`, `CORS_ORIGIN` ve en az 32 karakterlik rastgele JWT secret değerlerini kontrol edin.

3. Backend’i hazırlayın:

   ```powershell
   cd backend
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   npm run start:dev
   ```

API: `http://localhost:3000`  
Swagger: `http://localhost:3000/api`

`EADDRINUSE: 3000` hatası, 3000 portunda başka bir backend sürecinin çalıştığını gösterir. O süreci kapatın veya `.env` içindeki `PORT` değerini değiştirin.

## Frontend için API sözleşmesi

Frontend taban adresi geliştirme ortamında `http://localhost:3000` olmalıdır. JSON isteklerinde `Content-Type: application/json` gönderilir. Korumalı uçlarda ayrıca:

```http
Authorization: Bearer <accessToken>
```

### Kayıt

`POST /auth/register`

```json
{
  "fullName": "Ayşe Yılmaz",
  "email": "ayse.yilmaz@eteration.com",
  "phone": "05061234215",
  "password": "GucluParola1!"
}
```

Başarılı yanıt (`201`):

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "<uuid>",
    "fullName": "Ayşe Yılmaz",
    "email": "ayse.yilmaz@eteration.com",
    "phone": "05061234215"
  }
}
```

### Giriş

`POST /auth/login`

```json
{
  "email": "ayse.yilmaz@eteration.com",
  "password": "GucluParola1!"
}
```

Başarılı yanıt `200` durum koduyla kayıt yanıtıyla aynı yapıdadır.

### Profil ve masalar

- `GET /auth/me` — JWT zorunlu, giriş yapan kullanıcının profilini döndürür.
- `PATCH /auth/me` — JWT zorunlu, kullanıcının yalnız adını ve/veya telefonunu günceller; e-posta değiştirilemez.
- `PATCH /auth/me/password` — JWT zorunlu, mevcut şifreyi doğruladıktan sonra güçlü yeni şifreyi kaydeder ve başarı mesajı döndürür.
- `GET /tables/available?date=YYYY-MM-DD` — `{ "date": "YYYY-MM-DD", "tables": [1, 2, 3] }` biçiminde boş masa numaralarını döndürür.
- `GET /tables/statuses?date=YYYY-MM-DD` — JWT zorunlu, 32 masanın tamamını `available`, `reserved` veya `mine` durumuyla döndürür.

### Rezervasyonlar

- `POST /reservations` — JWT zorunlu.
- `GET /reservations/me` — JWT zorunlu, yalnız giriş yapan kullanıcının aktif rezervasyonlarını döndürür.
- `PATCH /reservations/:id` — JWT zorunlu, kullanıcının aktif rezervasyonunun tarihini ve/veya masasını günceller.
- `DELETE /reservations/:id` — JWT zorunlu, rezervasyonu soft-cancel eder ve başarıda gövdesiz `204` döndürür.

Oluşturma gövdesi:

```json
{
  "tableNumber": 12,
  "reservationDate": "2026-08-01"
}
```

Oluşturma ve güncelleme yanıtı:

```json
{
  "id": "<reservation-uuid>",
  "reservationDate": "2026-08-01",
  "tableNumber": 12
}
```

Güncellemede `tableNumber` ve `reservationDate` alanlarından biri veya ikisi gönderilebilir.
Güncelleme çakışırsa `409 Conflict` ve `Update failed.` mesajı döner; mevcut rezervasyon değişmeden kalır.

Başlıca hata durumları:

- `400`: İstek, UUID veya tarih doğrulaması başarısız.
- `401`: Oturum bilgisi yok, geçersiz, süresi dolmuş veya kullanıcı artık mevcut değil.
- `403`: Rezervasyon başka kullanıcıya ait.
- `404`: Masa veya rezervasyon bulunamadı.
- `409`: E-posta zaten kayıtlı, masa/tarih dolu veya kullanıcı aynı gün başka rezervasyona sahip.

Hata yanıtındaki `message` alanı her zaman tek bir İngilizce metindir. Frontend
bu mesajı doğrudan kullanıcıya gösterebilir.

## Test ve kalite komutları

Projede yalnız bir `backend/.env` dosyası kullanılır. Normal komutlar `DATABASE_URL` ve `PORT`; test komutları ise aynı dosyadaki `TEST_DATABASE_URL`, `TEST_DATABASE_ADMIN_URL`, `TEST_PORT`, `TEST_JWT_SECRET` ve `TEST_JWT_EXPIRES_IN` değerlerini otomatik olarak seçer.

```powershell
cd backend
npm run prisma:setup:test
npm run start:test
npm test
npm run test:cov
npm run lint
npm run build
```

`prisma:setup:test`, `reservation_test_db` veritabanını yoksa oluşturur, migration’ları uygular ve 32 masayı ekler. Normal uygulama `.env` içindeki `DATABASE_URL`; Jest ise aynı dosyadaki `TEST_DATABASE_URL` bağlantısını kullanır.

Test backend’i `npm run start:test` ile `.env` içindeki test değişkenleri üzerinden ve varsayılan olarak `http://localhost:3001` adresinde çalışır. Swagger arayüzü `http://localhost:3001/api` adresindedir. Aynı test veritabanını tarayıcıda görüntülemek için ayrı bir terminalde `npm run prisma:studio:test` çalıştırılır.

## Veritabanını terminalden görüntüleme

PostgreSQL istemcisi kuruluysa:

```powershell
psql "postgresql://reservation_user:reservation_password@localhost:5432/reservation_db"
```

Ardından:

```sql
SELECT * FROM "User";
SELECT * FROM "Reservation";
SELECT * FROM "Table" ORDER BY number;
```

Alternatif olarak backend klasöründe `npx prisma studio` komutu tarayıcı tabanlı bir veri görüntüleyici açar.
