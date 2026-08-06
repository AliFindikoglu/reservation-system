# Rezervasyon Sistemi API Dokümantasyonu

Bu belge, Rezervasyon Sistemi backend servisinin güncel HTTP sözleşmesini tanımlar. Kullanıcı ve admin arayüzleri aynı API’yi kullanır; erişim yetkileri JWT ve kullanıcı rolü üzerinden kontrol edilir.

## 1. Genel bilgiler

| Bilgi | Değer |
|---|---|
| Geliştirme Base URL | `http://localhost:3000` |
| Swagger UI | `http://localhost:3000/api` |
| Veri biçimi | JSON |
| Kimlik doğrulama | Bearer JWT |
| Varsayılan JWT süresi | 1 saat |
| Tarih biçimi | `YYYY-MM-DD` |
| Tarih-saat biçimi | ISO 8601 |
| İş saat dilimi | `Europe/Istanbul` |

Frontend ortam değişkeni:

```env
VITE_API_BASE_URL=http://localhost:3000
```

JSON gövdeli isteklerde:

```http
Content-Type: application/json
```

Korumalı endpoint’lerde:

```http
Authorization: Bearer <accessToken>
```

Swagger yalnızca `/api` yolundadır. Gerçek endpoint’lere `/api` öneki eklenmez:

```text
Doğru: GET /offices
Yanlış: GET /api/offices
Yanlış: GET /offices/get
```

## 2. Standart hata biçimi

API bütün hataları tek bir İngilizce mesajla döndürür:

```json
{
  "statusCode": 409,
  "message": "The selected table is already reserved for this date."
}
```

| HTTP | Anlam |
|---:|---|
| `200` | Başarılı okuma veya güncelleme |
| `201` | Kaynak oluşturuldu |
| `204` | İşlem başarılı, yanıt gövdesi yok |
| `400` | İstek veya alan doğrulaması başarısız |
| `401` | JWT eksik, geçersiz veya süresi dolmuş |
| `403` | Kullanıcının işlem yetkisi yok |
| `404` | Kaynak bulunamadı |
| `409` | İstek mevcut kayıt veya iş kuralıyla çakışıyor |

DTO’da tanımlanmayan fazladan alanlar kabul edilmez. Birden fazla doğrulama hatası oluşursa yalnız ilk mesaj döndürülür.

## 3. Temel iş kuralları

- Sistemde İstanbul ve İzmir gibi birden fazla ofis bulunabilir.
- İstanbul ofisinde 32, İzmir ofisinde 16 masa başlangıç verisi olarak oluşturulur.
- Masa numarası yalnız kendi ofisi içinde benzersizdir.
- Frontend ofis UUID değerlerini sabit yazmamalı, `GET /offices` ile almalıdır.
- Normal kullanıcı aynı gün yalnız bir aktif rezervasyona sahip olabilir.
- Aynı ofisteki bir masa, aynı gün yalnız bir aktif rezervasyon veya atama tarafından kullanılabilir.
- Normal rezervasyonlar bugün ile `MAX_RESERVATION_DAYS_AHEAD` arasındadır; varsayılan sınır 30 gündür.
- Rezervasyon ve değerlendirme silmeleri soft-delete/soft-cancel yaklaşımıyla geçmişte korunur.
- Ceza, masa ataması ve admin rezervasyonu kuralları backend tarafından uygulanır.
- Aktiflik ve rol kontrolleri yalnız frontend’e bırakılmaz.

## 4. Authentication API

### 4.1 Kayıt

```http
POST /auth/register
```

```json
{
  "fullName": "Ayşe Yılmaz",
  "email": "ayse.yilmaz@eteration.com",
  "phone": "05061234215",
  "password": "GucluParola1!"
}
```

Kurallar:

- E-posta geçerli şirket e-postası olmalıdır.
- Telefon `05` ile başlayan 11 haneli numara olmalıdır.
- Parola en az sekiz karakter; büyük harf, küçük harf, sayı ve sembol içermeli, boşluk içermemelidir.

`201 Created`:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "<user-uuid>",
    "fullName": "Ayşe Yılmaz",
    "email": "ayse.yilmaz@eteration.com",
    "phone": "05061234215",
    "role": "USER",
    "isActive": true
  }
}
```

Kayıt yanıtı JWT içerdiği için ayrıca login isteği gerekmez.

### 4.2 Giriş

```http
POST /auth/login
```

```json
{
  "email": "ayse.yilmaz@eteration.com",
  "password": "GucluParola1!"
}
```

Başarılı yanıt kayıt endpoint’iyle aynı `accessToken` ve `user` yapısını döndürür.

### 4.3 Profil

```http
GET /auth/me
Authorization: Bearer <accessToken>
```

```json
{
  "id": "<user-uuid>",
  "fullName": "Ayşe Yılmaz",
  "email": "ayse.yilmaz@eteration.com",
  "phone": "05061234215",
  "role": "USER",
  "isActive": true,
  "preferredOfficeId": "<istanbul-office-uuid>",
  "preferredOffice": {
    "id": "<istanbul-office-uuid>",
    "name": "Istanbul Office",
    "city": "Istanbul"
  },
  "themePreference": "LIGHT"
}
```

### 4.4 Profil güncelleme

```http
PATCH /auth/me
Authorization: Bearer <accessToken>
```

```json
{
  "fullName": "Ayşe Demir",
  "phone": "05069876543",
  "preferredOfficeId": "<izmir-office-uuid>",
  "themePreference": "DARK"
}
```

`fullName`, `phone`, `preferredOfficeId` ve `themePreference` alanları değiştirilebilir. E-posta değiştirilemez. Yeni kayıtlar kayıt formunda ofis seçmeden İstanbul ofisine bağlanır; tercih sonradan Settings ekranından değiştirilebilir.

### 4.5 Şifre değiştirme

```http
PATCH /auth/me/password
Authorization: Bearer <accessToken>
```

```json
{
  "currentPassword": "GucluParola1!",
  "newPassword": "YeniParola2!"
}
```

```json
{
  "message": "Your password has been changed successfully."
}
```

Şifre değişikliği mevcut JWT’yi iptal etmez. Refresh token ve `tokenVersion` mekanizması bulunmaz.

## 5. Offices API

Bu endpoint’ler public’tir.

### 5.1 Aktif ofisleri listeleme

```http
GET /offices
```

```json
[
  {
    "id": "<istanbul-office-uuid>",
    "name": "Istanbul Office",
    "city": "Istanbul",
    "address": null
  },
  {
    "id": "<izmir-office-uuid>",
    "name": "Izmir Office",
    "city": "Izmir",
    "address": null
  }
]
```

### 5.2 Ofis detayı

```http
GET /offices/:id
```

Geçersiz UUID için `400`, bulunamayan veya pasif ofis için `404` döner.

## 6. Tables API

### 6.1 Boş masaları listeleme

```http
GET /tables/available?officeId=<office-uuid>&date=2026-08-10
```

Public endpoint’tir.

```json
{
  "officeId": "<office-uuid>",
  "date": "2026-08-10",
  "tableCount": 32,
  "tables": [1, 2, 5, 8]
}
```

### 6.2 Kullanıcıya göre masa durumları

```http
GET /tables/statuses?officeId=<office-uuid>&date=2026-08-10
Authorization: Bearer <accessToken>
```

```json
{
  "officeId": "<office-uuid>",
  "date": "2026-08-10",
  "tables": [
    {
      "id": 1,
      "number": 1,
      "code": "A1",
      "status": "available",
      "equipments": [
        {
          "id": "<equipment-uuid>",
          "code": "MONITOR",
          "name": "Monitor"
        }
      ]
    },
    {
      "id": 2,
      "number": 2,
      "code": "A2",
      "status": "mine",
      "equipments": []
    },
    {
      "id": 3,
      "number": 3,
      "code": "A3",
      "status": "reserved",
      "equipments": []
    }
  ]
}
```

Normal kullanıcı durumları:

- `available`
- `reserved`
- `mine`

### 6.3 Masa detayı

```http
GET /tables/:id
Authorization: Bearer <accessToken>
```

Buradaki `id`, masa numarası değil veritabanındaki sayısal masa kimliğidir.

```json
{
  "id": 1,
  "number": 1,
  "code": "A1",
  "office": {
    "id": "<office-uuid>",
    "name": "Istanbul Office",
    "city": "Istanbul"
  },
  "equipments": [
    {
      "id": "<equipment-uuid>",
      "code": "DOCK_STATION",
      "name": "Dock Station"
    }
  ]
}
```

## 7. Reservations API

Bu bölümdeki bütün endpoint’ler Bearer JWT gerektirir.

### 7.1 Rezervasyon oluşturma

```http
POST /reservations
```

```json
{
  "officeId": "<office-uuid>",
  "tableNumber": 12,
  "reservationDate": "2026-08-10"
}
```

`201 Created`:

```json
{
  "id": "<reservation-uuid>",
  "reservationDate": "2026-08-10",
  "tableNumber": 12,
  "office": {
    "id": "<office-uuid>",
    "name": "Istanbul Office",
    "city": "Istanbul"
  },
  "equipments": [
    {
      "id": "<equipment-uuid>",
      "code": "MONITOR",
      "name": "Monitor"
    }
  ]
}
```

### 7.2 Kullanıcının aktif rezervasyonları

```http
GET /reservations/me
```

Yanıt rezervasyon tarihine göre artan sıralı bir dizidir. İptal edilen kayıtlar kullanıcıya dönmez.
Her rezervasyonda ilgili masanın aktif ekipmanları `equipments` dizisinde yer alır.

### 7.3 Rezervasyon güncelleme

```http
PATCH /reservations/:id
```

Yalnız tarih değişikliği:

```json
{
  "reservationDate": "2026-08-11"
}
```

Masa veya ofis değişikliği:

```json
{
  "officeId": "<office-uuid>",
  "tableNumber": 8
}
```

Masa değiştirilirken `officeId` ve `tableNumber` birlikte gönderilmelidir. Başarılı işlem mevcut rezervasyonun ID değerini korur.
Güncelleme yanıtındaki `equipments` dizisi yeni seçilen masanın aktif ekipmanlarını içerir.

### 7.4 Rezervasyon iptali

```http
DELETE /reservations/:id
```

Başarılı yanıt `204 No Content` döner. Frontend bu yanıtı JSON olarak ayrıştırmamalıdır.

## 8. Kullanıcı etkinlik API’si

Bu bölümdeki bütün endpoint’ler Bearer JWT ve aktif kullanıcı gerektirir.

### 8.1 Etkinlikleri listeleme

```http
GET /events
GET /events?scope=UPCOMING
GET /events?scope=PAST
GET /events?scope=ALL
```

Varsayılan değer `UPCOMING`’dir.

```json
[
  {
    "id": "<event-uuid>",
    "title": "TypeScript Workshop",
    "description": "Practical TypeScript workshop.",
    "startsAt": "2026-09-15T06:00:00.000Z",
    "endsAt": "2026-09-15T14:00:00.000Z",
    "location": "ITU ARI 3 Conference Hall",
    "createdAt": "2026-08-05T10:00:00.000Z",
    "updatedAt": "2026-08-05T10:00:00.000Z",
    "ratingSummary": {
      "average": 4.5,
      "count": 8
    }
  }
]
```

Değerlendirme yoksa `average: null` ve `count: 0` döner.

### 8.2 Etkinlik detayı

```http
GET /events/:id
```

Liste alanlarına ek olarak aktif değerlendirmeler döner:

```json
{
  "id": "<event-uuid>",
  "title": "TypeScript Workshop",
  "description": "Practical TypeScript workshop.",
  "startsAt": "2026-09-15T06:00:00.000Z",
  "endsAt": "2026-09-15T14:00:00.000Z",
  "location": "ITU ARI 3 Conference Hall",
  "createdAt": "2026-08-05T10:00:00.000Z",
  "updatedAt": "2026-08-05T10:00:00.000Z",
  "ratingSummary": {
    "average": 5,
    "count": 1
  },
  "reviews": [
    {
      "id": "<review-uuid>",
      "rating": 5,
      "comment": "Very useful.",
      "user": {
        "id": "<user-uuid>",
        "fullName": "Ayşe Yılmaz"
      },
      "createdAt": "2026-09-16T10:00:00.000Z",
      "updatedAt": "2026-09-16T10:00:00.000Z"
    }
  ]
}
```

### 8.3 Etkinlik önerisi gönderme

```http
POST /events/suggestions
```

```json
{
  "suggestionText": "A practical TypeScript workshop would be useful."
}
```

```json
{
  "message": "Your event suggestion has been submitted successfully."
}
```

Kullanıcı öneri geçmişini listeleyemez. Aynı kullanıcının aynı metinli bekleyen önerisi `409 Conflict` döner.

### 8.4 Değerlendirme oluşturma

```http
POST /events/:id/reviews
```

```json
{
  "rating": 5,
  "comment": "Very useful event."
}
```

- `rating` zorunlu ve 1–5 arasında tam sayıdır.
- `comment` isteğe bağlıdır ve `null` olabilir.
- Yalnız etkinlik bittikten sonra değerlendirme yapılabilir.
- Kullanıcı aynı etkinlikte yalnız bir aktif değerlendirmeye sahip olabilir.

### 8.5 Kendi değerlendirmesini güncelleme

```http
PATCH /events/:id/reviews/me
```

```json
{
  "rating": 4,
  "comment": "Updated review."
}
```

Alanlardan en az biri gönderilmelidir.

### 8.6 Kendi değerlendirmesini silme

```http
DELETE /events/:id/reviews/me
```

```json
{
  "message": "Your event review has been deleted successfully."
}
```

Silme soft-delete işlemidir. Kullanıcı daha sonra yeniden değerlendirme oluşturabilir.

## 9. Bildirimler, ekipmanlar ve kullanıcı atamaları

### 9.1 Bildirimler

```http
GET /notifications/me
PATCH /notifications/:id/read
```

Bildirim örneği:

```json
{
  "id": "<notification-uuid>",
  "userId": "<user-uuid>",
  "type": "EVENT_SUGGESTION_ACCEPTED",
  "title": "Event suggestion accepted",
  "message": "Your event suggestion was accepted.",
  "isRead": false,
  "relatedEntityType": "Event",
  "relatedEntityId": "<event-uuid>",
  "createdAt": "2026-08-05T10:00:00.000Z",
  "readAt": null
}
```

Okundu işaretleme yanıtı:

```json
{
  "message": "The notification has been marked as read."
}
```

### 9.2 Ekipman kataloğu

```http
GET /equipments
Authorization: Bearer <accessToken>
```

```json
{
  "equipments": [
    {
      "id": "<equipment-uuid>",
      "code": "MONITOR",
      "name": "Monitor"
    }
  ]
}
```

### 9.3 Kullanıcının masa atamaları

```http
GET /table-assignments/me
Authorization: Bearer <accessToken>
```

### 9.4 Kullanıcının ceza geçmişi

```http
GET /restrictions/me
Authorization: Bearer <accessToken>
```

## 10. Admin API

Bu bölümdeki bütün endpoint’ler Bearer JWT ve `ADMIN` rolü gerektirir.

### 10.1 Kullanıcı yönetimi

```http
GET   /admin/users?includeInactive=true
PATCH /admin/users/:id/status
PATCH /admin/users/:id/role
```

```json
{
  "isActive": false
}
```

```json
{
  "role": "ADMIN"
}
```

### 10.2 Rezervasyonları filtreleme

```http
GET /admin/reservations
```

Desteklenen query parametreleri:

| Parametre | Biçim |
|---|---|
| `officeId` | UUID |
| `city` | String |
| `userId` | UUID |
| `startsOn` | `YYYY-MM-DD` |
| `endsOn` | `YYYY-MM-DD` |
| `status` | `ACTIVE`, `CANCELLED`, `ALL` |

Örnek:

```http
GET /admin/reservations?officeId=<uuid>&startsOn=2026-08-01&endsOn=2026-08-31&status=ACTIVE
```

### 10.3 Admin rezervasyon işlemleri

```http
POST   /admin/reservations/preview
POST   /admin/reservations
POST   /admin/reservations/:id/preview-update
PATCH  /admin/reservations/:id
DELETE /admin/reservations/:id
```

Oluşturma ve önizleme gövdesi:

```json
{
  "userId": "<user-uuid>",
  "officeId": "<office-uuid>",
  "tableNumber": 12,
  "reservationDate": "2026-08-10",
  "confirmOverride": false,
  "reason": "Operational requirement",
  "replacementTableNumber": 15
}
```

`replacementTableNumber` isteğe bağlıdır ve seçilen `officeId` içindeki masayı ifade eder. Replacement masa farklı bir ofisten seçilemez. Preview yanıtı etkilenecek rezervasyon ve atamaları gösterir; frontend onaydan sonra aynı isteği `confirmOverride: true` ile gönderir.

### 10.4 Tarih aralıklı masa atamaları

```http
GET    /admin/table-assignments?includeRevoked=true
POST   /admin/table-assignments/preview
POST   /admin/table-assignments
PATCH  /admin/table-assignments/:id/end-date
DELETE /admin/table-assignments/:id
```

```json
{
  "userId": "<user-uuid>",
  "officeId": "<office-uuid>",
  "tableNumber": 12,
  "startsOn": "2026-08-10",
  "endsOn": "2026-09-10",
  "confirmOverride": false,
  "reason": "Team assignment"
}
```

`endsOn: null` süresiz atama anlamına gelir.

### 10.5 Kullanıcı cezaları

```http
GET    /admin/restrictions?includeRevoked=true
POST   /admin/restrictions/preview
POST   /admin/restrictions
PATCH  /admin/restrictions/:id
DELETE /admin/restrictions/:id
```

```json
{
  "userId": "<user-uuid>",
  "startsOn": "2026-08-10",
  "endsOn": "2026-08-20",
  "reason": "Policy violation",
  "confirmImpact": false
}
```

Preview sonrasında işlem kabul edilirse `confirmImpact: true` gönderilir.

### 10.6 Admin Floor Plan

```http
GET /admin/tables/statuses?officeId=<office-uuid>&date=2026-08-10
```

Admin durumları:

- `available`
- `reserved`
- `admin_reserved`
- `assigned`

Yanıt normal masa bilgilerine ek olarak `occupant`, `reservationId`, `assignmentId` ve `underlyingAssignment` alanlarını içerir.

### 10.7 Ekipman yönetimi

```http
POST   /admin/equipments
DELETE /admin/equipments/:id
PUT    /admin/tables/:id/equipments
```

Yeni ekipman:

```json
{
  "name": "Standing Desk Converter",
  "code": "STANDING_DESK_CONVERTER"
}
```

Masa ekipmanlarının eksiksiz yeni listesi:

```json
{
  "officeId": "<office-uuid>",
  "equipmentIds": ["<equipment-uuid-1>", "<equipment-uuid-2>"]
}
```

Boş `equipmentIds` dizisi masadaki bütün ekipmanları kaldırır.

Ekipman türünü silme:

```http
DELETE /admin/equipments/<equipment-uuid>
Authorization: Bearer <admin-access-token>
```

```json
{
  "message": "The equipment has been deleted successfully."
}
```

Silme işlemi ekipmanı fiziksel olarak kaldırmaz; `isActive` alanını `false`
yapar, ekipmanı bağlı olduğu bütün masalardan kaldırır ve işlemi audit log’a
kaydeder. Silinmiş bir ekipmanın tekrar silinmesi `409 Conflict`, bulunamayan
bir kimlik gönderilmesi `404 Not Found` döndürür.

### 10.8 Admin etkinlik yönetimi

```http
GET    /admin/events
POST   /admin/events
PATCH  /admin/events/:id
DELETE /admin/events/:id
```

Etkinlik oluşturma:

```json
{
  "title": "TypeScript Workshop",
  "description": "Practical TypeScript workshop.",
  "startsAt": "2026-09-15T09:00:00+03:00",
  "endsAt": "2026-09-15T17:00:00+03:00",
  "location": "ITU ARI 3 Conference Hall"
}
```

Etkinlik doğrudan yayınlanır; draft durumu bulunmaz. İptal gövdesi:

```json
{
  "reason": "The event has been postponed."
}
```

### 10.9 Admin etkinlik önerileri

```http
GET  /admin/event-suggestions
POST /admin/event-suggestions/:id/accept
POST /admin/event-suggestions/:id/reject
```

Kabul isteği gerçek etkinliğin tüm alanlarını içerir. Reddetme isteği:

```json
{
  "reason": "The suggestion is outside the current event plan."
}
```

Öneri durumları `PENDING`, `ACCEPTED` ve `REJECTED` değerleridir. Kabul veya ret sonrasında öneriyi yapan kullanıcıya bildirim oluşturulur.

### 10.10 Uygunsuz değerlendirme silme

```http
DELETE /admin/event-reviews/:reviewId
```

Buradaki kimlik `eventId` değil değerlendirme kaydının `reviewId` değeridir.

### 10.11 Audit log

```http
GET /admin/audit-logs
```

Admin tarafından gerçekleştirilen yönetim işlemleri denetim geçmişinde tutulur.

## 11. Öncelik sırası

Bir tarih ve masa değerlendirilirken temel öncelik sırası:

1. Kullanıcının aktifliği
2. Kullanıcının ilgili tarihteki cezası
3. Admin günlük rezervasyonu
4. Tarih aralıklı masa ataması
5. Normal kullanıcı rezervasyonu
6. Boş masa

## 12. Frontend entegrasyon akışı

1. Uygulama açılışında `GET /offices` çağrılır.
2. Kullanıcının seçtiği `officeId`, floor plan isteklerinde kullanılır.
3. Oturum varsa `GET /tables/statuses`, oturum yoksa `GET /tables/available` çağrılır.
4. Rezervasyon oluşturma ve masa değiştirme isteklerinde `officeId` gönderilir.
5. `GET /reservations/me` yanıtındaki `office` bilgisi rezervasyon kartında gösterilir.
6. Etkinlik listesi için `GET /events?scope=UPCOMING`, geçmiş için `scope=PAST` kullanılır.
7. Etkinlik bittikten sonra değerlendirme formu etkinleştirilir.
8. Admin rezervasyon listesi `officeId`, şehir, tarih, kullanıcı ve durumla filtrelenebilir.
9. `401` yanıtında yerel oturum temizlenip kullanıcı login ekranına yönlendirilir.
10. `409` sonrasında backend mesajı gösterilip ilgili masa veya liste verisi yeniden alınır.

## 13. Kapsam dışı özellikler

- E-posta değiştirme
- Şifre sıfırlama
- Refresh token
- Server-side logout veya token iptali
- Rezervasyon kodu
- Etkinlik katılım takibi
- Etkinlik participant count
- Etkinlik draft durumu
- Kullanıcının gönderdiği etkinlik önerilerini sonradan listelemesi

## 14. Güvenlik notları

- `.env`, JWT secret, veritabanı parolası ve `passwordHash` istemciye gönderilmemelidir.
- Parolalar hiçbir API yanıtında dönmez.
- Frontend’de role göre görünürlük sağlansa bile nihai yetkilendirme backend tarafından yapılır.
- Üretim ortamında HTTPS ve güvenilir CORS origin değerleri kullanılmalıdır.
