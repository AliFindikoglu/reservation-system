# Masa Rezervasyon API Referansı

Bu belge, Masa Rezervasyon Sistemi backend servisinin HTTP sözleşmesini tanımlar. Web, mobil veya başka bir istemci geliştiren tüm tüketiciler için geçerlidir.

## 1. Genel bilgiler

| Bilgi | Değer |
|---|---|
| API sürümü | `1.0` |
| Veri biçimi | JSON |
| Kimlik doğrulama | Bearer JWT |
| JWT geçerlilik süresi | 1 saat |
| Tarih biçimi | `YYYY-MM-DD` |
| İş saat dilimi | `Europe/Istanbul` |
| Swagger yolu | `/api` |

Yerel ortam adresleri:

| Ortam | Base URL | Swagger |
|---|---|---|
| Geliştirme | `http://localhost:3000` | `http://localhost:3000/api` |
| Test | `http://localhost:3001` | `http://localhost:3001/api` |

Üretim ortamında istemci, sistem yöneticisinin sağladığı HTTPS base URL’yi kullanmalıdır. `localhost`, yalnız API ile istemci aynı bilgisayarda çalışıyorsa geçerlidir.

## 2. İstek kuralları

JSON gövdeli isteklerde:

```http
Content-Type: application/json
```

Korumalı endpoint’lerde:

```http
Authorization: Bearer <accessToken>
```

Backend, DTO’da tanımlanmayan alanları kabul etmez. Fazladan bir alan gönderildiğinde `400 Bad Request` döner.

## 3. İş kuralları

- Sistemde 1–32 arasında 32 masa bulunur.
- Kullanıcı yalnız yapılandırılmış şirket e-posta uzantısıyla kayıt olabilir.
- E-posta adresi küçük harfe dönüştürülerek saklanır ve benzersizdir.
- Bir kullanıcı aynı tarih için yalnız bir aktif rezervasyona sahip olabilir.
- Bir masa aynı tarih için yalnız bir aktif kullanıcı tarafından rezerve edilebilir.
- Rezervasyon bugün ile yapılandırılmış ileri gün sınırı arasında oluşturulabilir. Varsayılan sınır 30 gündür ve son gün dahildir.
- Kullanıcı yalnız kendi aktif rezervasyonlarını görüntüleyebilir.
- Bugünkü ve gelecekteki aktif rezervasyonların tarihi ve masası güncellenebilir.
- Rezervasyonlar fiziksel olarak silinmez; `isCancelled` ve `cancelledAt` alanlarıyla geçmişte saklanır.
- Rezervasyon iptal edildiğinde masa ve kullanıcı aynı tarih için yeniden rezervasyon yapabilir.
- Rezervasyon sahipliği JWT’deki kullanıcı kimliğiyle belirlenir.
- Rezervasyon kodu veya ayrı yönetim token’ı kullanılmaz.

Aktif masa/tarih ve aktif kullanıcı/tarih benzersizlikleri PostgreSQL partial unique index’leriyle korunur. Eşzamanlı çakışan isteklerden yalnız ilk tamamlanan başarılı olur.

## 4. Veri modelleri

### User

```ts
interface User {
  id: string;       // UUID
  fullName: string;
  email: string;
  phone: string;
}
```

### AuthResponse

```ts
interface AuthResponse {
  accessToken: string;
  user: User;
}
```

### Reservation

```ts
interface Reservation {
  id: string;                 // UUID
  reservationDate: string;    // YYYY-MM-DD
  tableNumber: number;        // 1-32
}
```

### AvailableTablesResponse

```ts
interface AvailableTablesResponse {
  date: string;       // YYYY-MM-DD
  tables: number[];   // Boş masa numaraları
}
```

### ApiError

```ts
interface ApiError {
  statusCode: number;
  message: string;
}
```

## 5. Authentication API

### 5.1 Kullanıcı kaydı

```http
POST /auth/register
```

Kimlik doğrulama gerekmez.

İstek gövdesi:

```json
{
  "fullName": "Ayşe Yılmaz",
  "email": "ayse.yilmaz@eteration.com",
  "phone": "05061234215",
  "password": "GucluParola1!"
}
```

Alan doğrulamaları:

| Alan | Kural |
|---|---|
| `fullName` | `null`, boş veya yalnızca boşluklardan oluşmayan string |
| `email` | Geçerli e-posta ve şirket uzantısı |
| `phone` | `05` ile başlayan 11 haneli Türkiye cep telefonu numarası |
| `password` | En az 8 karakterli; büyük harf, küçük harf, sayı ve sembol içeren, boşluk içermeyen string |

Başarılı yanıt — `201 Created`:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "99e211c1-d21d-4932-82b4-8a8201295e3e",
    "fullName": "Ayşe Yılmaz",
    "email": "ayse.yilmaz@eteration.com",
    "phone": "05061234215"
  }
}
```

Kayıt yanıtı JWT içerdiğinden kullanıcı ayrıca login olmak zorunda değildir.

Hatalar:

| HTTP | Açıklama |
|---:|---|
| `400` | Alan doğrulaması başarısız |
| `409` | E-posta zaten kayıtlı |

### 5.2 Login

```http
POST /auth/login
```

Kimlik doğrulama gerekmez.

İstek gövdesi:

```json
{
  "email": "ayse.yilmaz@eteration.com",
  "password": "GucluParola1!"
}
```

Başarılı yanıt — `200 OK`: `AuthResponse`

Hatalar:

| HTTP | Açıklama |
|---:|---|
| `400` | İstek doğrulaması başarısız |
| `401` | E-posta veya parola hatalı |

### 5.3 Aktif kullanıcı profili

```http
GET /auth/me
Authorization: Bearer <accessToken>
```

Başarılı yanıt — `200 OK`:

```json
{
  "id": "99e211c1-d21d-4932-82b4-8a8201295e3e",
  "fullName": "Ayşe Yılmaz",
  "email": "ayse.yilmaz@eteration.com",
  "phone": "05061234215"
}
```

Hatalar:

| HTTP | Açıklama |
|---:|---|
| `401` | JWT eksik, geçersiz, süresi dolmuş veya kullanıcı mevcut değil |

### 5.4 Profil güncelleme

```http
PATCH /auth/me
Authorization: Bearer <accessToken>
```

Yalnız `fullName` ve `phone` değiştirilebilir. E-posta değiştirilemez.

İstek örneği:

```json
{
  "fullName": "Ayşe Kaya",
  "phone": "05069999999"
}
```

Alanlardan yalnız biri de gönderilebilir.

Başarılı yanıt — `200 OK`:

```json
{
  "id": "99e211c1-d21d-4932-82b4-8a8201295e3e",
  "fullName": "Ayşe Kaya",
  "email": "ayse.yilmaz@eteration.com",
  "phone": "05069999999"
}
```

Hatalar:

| HTTP | Açıklama |
|---:|---|
| `400` | Gövde boş, ad/telefon geçersiz veya `email` gibi izin verilmeyen alan gönderildi |
| `401` | JWT problemi |

### 5.5 Şifre değiştirme

```http
PATCH /auth/me/password
Authorization: Bearer <accessToken>
Content-Type: application/json
```

İstek gövdesi:

```json
{
  "currentPassword": "GucluParola1!",
  "newPassword": "YeniGucluParola2!"
}
```

Yeni şifre en az sekiz karakterden oluşmalı; boşluk içermemeli ve en az bir büyük harf, bir küçük harf, bir sayı ve bir sembol içermelidir. Yeni şifre mevcut şifreyle aynı olamaz.

Başarılı yanıt — `200 OK`:

```json
{
  "message": "Your password has been changed successfully."
}
```

Hatalar:

| HTTP | Açıklama |
|---:|---|
| `400` | Yeni şifre güvenlik kurallarına uymuyor, mevcut şifreyle aynı veya desteklenmeyen alan gönderildi |
| `401` | JWT problemi, kullanıcı bulunamadı veya mevcut şifre yanlış |

Şifre değiştirildiğinde mevcut JWT iptal edilmez ve bir saatlik süresi dolana kadar geçerli kalır. Bu sürümde `tokenVersion` veya ayrı token iptal mekanizması bulunmaz.

## 6. Tables API

### 6.1 Boş masaları listeleme

```http
GET /tables/available?date=2026-08-01
```

Bu endpoint public’tir.

Başarılı yanıt — `200 OK`:

```json
{
  "date": "2026-08-01",
  "tables": [1, 2, 4, 5, 8, 12]
}
```

`tables` dizisi yalnız seçilen tarihte boş olan masa numaralarını içerir.

Hatalar:

| HTTP | Açıklama |
|---:|---|
| `400` | Tarih geçersiz, geçmişte veya ileri gün sınırının dışında |

### 6.2 Masa durumlarını listeleme

```http
GET /tables/statuses?date=2026-08-01
Authorization: Bearer <accessToken>
```

Bu endpoint JWT ile korunur ve seçilen tarihteki 32 masanın tamamını giriş yapan kullanıcıya göre durumlarıyla döndürür.

Başarılı yanıt — `200 OK`:

```json
{
  "date": "2026-08-01",
  "tables": [
    {
      "number": 1,
      "status": "available"
    },
    {
      "number": 2,
      "status": "reserved"
    },
    {
      "number": 3,
      "status": "mine"
    }
  ]
}
```

Durumlar:

- `available`: Seçilen tarihte aktif rezervasyonu bulunmayan masa.
- `reserved`: Başka bir kullanıcı tarafından aktif olarak rezerve edilmiş masa.
- `mine`: Giriş yapan kullanıcı tarafından aktif olarak rezerve edilmiş masa.

İptal edilmiş rezervasyonlar masa durumunu etkilemez. Yanıtta rezervasyon sahibi kullanıcıların kimliği veya kişisel bilgileri bulunmaz.

Hatalar:

| HTTP | Açıklama |
|---:|---|
| `400` | Tarih geçersiz, geçmişte veya ileri gün sınırının dışında |
| `401` | JWT eksik, geçersiz veya süresi dolmuş |

## 7. Reservations API

Bu bölümdeki tüm endpoint’ler Bearer JWT gerektirir.

### 7.1 Rezervasyon oluşturma

```http
POST /reservations
Authorization: Bearer <accessToken>
```

İstek gövdesi:

```json
{
  "tableNumber": 12,
  "reservationDate": "2026-08-01"
}
```

Başarılı yanıt — `201 Created`:

```json
{
  "id": "0c2ae9a3-8106-47f7-859f-c23761f55dd7",
  "reservationDate": "2026-08-01",
  "tableNumber": 12
}
```

Hatalar:

| HTTP | Açıklama |
|---:|---|
| `400` | Tarih veya masa numarası geçersiz |
| `401` | JWT problemi |
| `404` | Masa bulunamadı |
| `409` | Masa/tarih dolu veya kullanıcının aynı gün başka rezervasyonu var |

Bir istemci `409` aldıktan sonra boş masa listesini yeniden sorgulamalıdır.

### 7.2 Kullanıcının rezervasyonları

```http
GET /reservations/me
Authorization: Bearer <accessToken>
```

Başarılı yanıt — `200 OK`:

```json
[
  {
    "id": "0c2ae9a3-8106-47f7-859f-c23761f55dd7",
    "reservationDate": "2026-08-01",
    "tableNumber": 12
  }
]
```

Rezervasyonu olmayan kullanıcı için:

```json
[]
```

Sonuçlarda yalnız aktif rezervasyonlar yer alır ve kayıtlar rezervasyon tarihine göre artan sırada döner. İptal edilmiş kayıtlar veritabanında denetim geçmişi olarak korunur.
İptal edilmiş kayıtlar kullanıcı endpoint’ine dönmez. Adminler geçmiş ve iptal edilmiş kayıtları `/admin/reservations` üzerinden görüntüleyebilir.

### 7.3 Rezervasyon güncelleme

```http
PATCH /reservations/:id
Authorization: Bearer <accessToken>
```

Yalnız masa:

```json
{
  "tableNumber": 15
}
```

Yalnız tarih:

```json
{
  "reservationDate": "2026-08-02"
}
```

Her iki alan:

```json
{
  "tableNumber": 15,
  "reservationDate": "2026-08-02"
}
```

Başarılı yanıt — `200 OK`: güncellenmiş `Reservation`

Hatalar:

| HTTP | Açıklama |
|---:|---|
| `400` | UUID, tarih veya masa numarası geçersiz |
| `401` | JWT problemi |
| `403` | Rezervasyon başka kullanıcıya ait |
| `404` | Rezervasyon veya masa bulunamadı |
| `409` | Yeni masa/tarih dolu veya kullanıcının yeni tarihte başka aktif rezervasyonu var; `Update failed.` mesajı döner |

Güncelleme tek bir veritabanı işlemiyle yapılır. Çakışma durumunda işlem geri alınır ve rezervasyonun önceki tarih ve masa bilgileri korunur.

### 7.4 Rezervasyon iptali

```http
DELETE /reservations/:id
Authorization: Bearer <accessToken>
```

Başarılı yanıt — `204 No Content`

Yanıt gövdesi yoktur. İstemci `204` yanıtında JSON ayrıştırmaya çalışmamalıdır.

İptal işlemi kaydı fiziksel olarak silmez. `isCancelled` alanı `true`, `cancelledAt` alanı iptal zamanı olarak güncellenir. Masa aynı tarih için yeniden kullanılabilir ve rezervasyonunu iptal eden kullanıcı aynı gün tekrar rezervasyon oluşturabilir.

Hatalar:

| HTTP | Açıklama |
|---:|---|
| `400` | Rezervasyon kimliği UUID değil, rezervasyon geçmişte veya zaten iptal edilmiş |
| `401` | JWT problemi |
| `403` | Rezervasyon başka kullanıcıya ait |
| `404` | Rezervasyon bulunamadı |

## 8. Hata yanıtları

API hata yanıtlarında `message` her zaman tek bir İngilizce metindir:

```json
{
  "statusCode": 409,
  "message": "The selected table is already reserved for this date."
}
```

Doğrulama hatası:

```json
{
  "statusCode": 400,
  "message": "Please use your company email address."
}
```

Bir istekte birden fazla geçersiz alan olsa bile yalnızca ilk doğrulama
mesajı döndürülür. Ayrı bir `error` alanı hata yanıtlarında yer almaz.

### HTTP durum kodları

| Kod | Anlam |
|---:|---|
| `200` | Başarılı okuma veya güncelleme |
| `201` | Kaynak başarıyla oluşturuldu |
| `204` | Başarılı silme; gövde yok |
| `400` | İstek veya alan doğrulaması başarısız |
| `401` | Kimlik doğrulama başarısız |
| `403` | Kaynak başka kullanıcıya ait |
| `404` | Kaynak bulunamadı |
| `409` | Benzersizlik veya rezervasyon çakışması |

## 9. İstemci entegrasyon önerileri

1. API base URL’yi ortam değişkeninden okuyun.
2. Kayıt veya login yanıtındaki JWT’yi güvenli istemci state’inde saklayın.
3. Korumalı isteklere Bearer başlığını otomatik ekleyin.
4. Uygulama açılışında `GET /auth/me` ile saklanmış oturumu doğrulayın.
5. `401` yanıtında yerel oturumu temizleyip kullanıcıyı login akışına yönlendirin.
6. Floor Plan ekranında tarih seçildiğinde JWT ile `GET /tables/statuses` isteğini yenileyin.
7. `409` sonrasında kullanıcıya backend mesajını gösterip masa listesini yeniden alın.
8. Kullanıcının rezervasyonlarını `GET /reservations/me` üzerinden yönetin.
9. Silme işleminde `204` yanıt gövdesini ayrıştırmayın.
10. Profil formunda e-postayı salt okunur gösterin ve güncelleme isteğine eklemeyin.
11. Şifre değiştirme formunda mevcut ve yeni şifreyi `PATCH /auth/me/password` endpoint’ine gönderin.

Basit hata mesajı okuyucusu:

```ts
function getErrorMessage(error: ApiError): string {
  return error.message;
}
```

## 10. Güvenlik notları

- `.env`, JWT secret, veritabanı parolası ve `passwordHash` istemciye veya kaynak kontrol sistemine gönderilmemelidir.
- Parolalar API yanıtlarında hiçbir zaman dönmez.
- İstemci, JWT içeriğini yetkilendirme kararı için güvenilir kaynak kabul etmemelidir; nihai yetki kontrolü backend tarafından yapılır.
- Üretim ortamında yalnız HTTPS kullanılmalıdır.
- CORS origin değeri yalnız güvenilen istemci adreslerini içermelidir.

## 11. Kapsam dışı özellikler

Aşağıdaki özellikler API’nin mevcut sürümünde bulunmaz:

- E-posta değiştirme
- Parola sıfırlama
- Refresh token
- Server-side logout veya token iptali
- Rezervasyon kodu

## 12. Admin ve masa yönetimi API’si

Bu bölümdeki bütün endpoint’ler Bearer JWT ve `ADMIN` rolü gerektirir. Normal kullanıcı geçerli JWT ile istek gönderse bile `403 Forbidden` alır.

### 12.1 Kullanıcılar

```http
GET /admin/users?includeInactive=true
PATCH /admin/users/:id/status
PATCH /admin/users/:id/role
```

Durum güncelleme gövdesi:

```json
{ "isActive": false }
```

Rol güncelleme gövdesi:

```json
{ "role": "ADMIN" }
```

Pasifleştirilen kullanıcı giriş yapamaz; mevcut JWT’si de bir sonraki istekte reddedilir. Gelecekteki rezervasyonları soft-cancel, aktif masa atamaları revoke edilir. Son aktif admin pasifleştirilemez veya `USER` rolüne indirilemez.

### 12.2 Admin rezervasyonları

```http
GET    /admin/reservations?includeCancelled=true
POST   /admin/reservations/preview
POST   /admin/reservations
POST   /admin/reservations/:id/preview-update
PATCH  /admin/reservations/:id
DELETE /admin/reservations/:id
```

Oluşturma ve önizleme gövdesi:

```json
{
  "userId": "<uuid>",
  "tableNumber": 12,
  "reservationDate": "2026-08-10",
  "confirmOverride": true,
  "reason": "Operational requirement",
  "replacementTableNumber": 15
}
```

`replacementTableNumber` isteğe bağlıdır ve yerinden edilen kullanıcıya aynı transaction içerisinde yeni masa verilmesini sağlar. Aynı aktif rezervasyon zaten varsa `409 Conflict` ve `This reservation already exists.` mesajı döner.

Admin günlük rezervasyonu, mevcut `TableAssignment` kaydını silmez; yalnız ilgili tarih için ondan daha yüksek önceliklidir. Günlük kayıt iptal edilirse atama tekrar geçerli olur.

### 12.3 Tarih aralıklı masa atamaları

```http
GET    /admin/table-assignments?includeRevoked=true
POST   /admin/table-assignments/preview
POST   /admin/table-assignments
PATCH  /admin/table-assignments/:id/end-date
DELETE /admin/table-assignments/:id
```

```json
{
  "userId": "<uuid>",
  "tableNumber": 12,
  "startsOn": "2026-08-10",
  "endsOn": null,
  "confirmOverride": true,
  "reason": "Team assignment"
}
```

`endsOn: null` süresiz atama anlamına gelir. Başlangıç tarihi sonradan değiştirilemez; normal bitiş tarihi güncellenebilir. Erken kaldırma `revokedAt` ile tutulur. Aynı atama yeniden gönderilirse `409 Conflict` ve `This table assignment already exists.` mesajı döner.

PostgreSQL exclusion constraint’leri aynı kullanıcı veya masa için çakışan aktif tarih aralıklarının eşzamanlı oluşturulmasını engeller.

### 12.4 Kullanıcı cezaları

```http
GET    /admin/restrictions?includeRevoked=true
POST   /admin/restrictions/preview
POST   /admin/restrictions
PATCH  /admin/restrictions/:id
DELETE /admin/restrictions/:id
```

```json
{
  "userId": "<uuid>",
  "startsOn": "2026-08-10",
  "endsOn": "2026-08-20",
  "reason": "Policy violation",
  "confirmImpact": true
}
```

Ceza aralığındaki bütün rezervasyonlar, admin tarafından oluşturulmuş olsalar da soft-cancel edilir. Çakışan masa atamaları tamamen revoke edilir ve ceza bitiminde otomatik geri gelmez. Ceza kaldırılmadan admin de ilgili kullanıcı için rezervasyon veya atama oluşturamaz.

### 12.5 Ekipmanlar ve masa detayları

Aktif ekipman kataloğu:

```http
GET /equipments
```

Masa detayları:

```http
GET /tables/:id
```

```json
{
  "id": 1,
  "number": 1,
  "code": "A1",
  "equipments": [
    { "id": "<uuid>", "code": "MONITOR", "name": "Monitor" },
    { "id": "<uuid>", "code": "DOCK_STATION", "name": "Dock Station" }
  ]
}
```

Admin checkbox seçimlerinin tamamını şu endpoint’e gönderir:

```http
PUT /admin/tables/:id/equipments
```

```json
{
  "equipmentIds": ["<monitor-uuid>", "<dock-station-uuid>"]
}
```

Gönderilen dizi masadaki ekipmanların yeni ve eksiksiz hâlidir. Boş dizi bütün ekipmanları kaldırır.

### 12.6 Masa durumları

Normal kullanıcı `/tables/statuses` yanıtında yalnız `available`, `reserved` ve `mine` değerlerini görür. Admin:

```http
GET /admin/tables/statuses?date=2026-08-10
```

üzerinden `available`, `reserved`, `admin_reserved` ve `assigned` durumlarını; rezervasyon/atama kimliğini ve kullanıcı özetini görebilir. Admin tarih sorgusu normal kullanıcının 30 günlük sınırına tabi değildir.

### 12.7 Bildirimler ve audit log

```http
GET   /notifications/me
PATCH /notifications/:id/read
GET   /admin/audit-logs
```

Bildirimler veritabanında saklanır. Kullanıcıya işlemin bir admin tarafından yapıldığı bildirilir ancak adminin adı gösterilmez. Admin rolü, kullanıcı durumu, rezervasyon, atama, ceza ve masa ekipmanı değişiklikleri audit log’a yazılır.

### 12.8 Öncelik sırası

Önce kullanıcının aktifliği ve ilgili tarihte cezasının bulunup bulunmadığı kontrol edilir. Masa doluluk sırası:

1. Admin günlük rezervasyonu
2. Aktif tarih aralıklı `TableAssignment`
3. Normal kullanıcı rezervasyonu
4. Boş masa

İstemciler bu özellikler için endpoint çağrısı yapmamalıdır.
