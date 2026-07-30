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
İptal edilmiş kayıtlar kullanıcı endpoint’ine dönmez; yetkili kişiler bunları veritabanı veya Prisma Studio üzerinden görüntüleyebilir. Bu sürümde ayrı bir admin HTTP endpoint’i bulunmaz.

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
6. Tarih seçildiğinde `GET /tables/available` isteğini yenileyin.
7. `409` sonrasında kullanıcıya backend mesajını gösterip masa listesini yeniden alın.
8. Kullanıcının rezervasyonlarını `GET /reservations/me` üzerinden yönetin.
9. Silme işleminde `204` yanıt gövdesini ayrıştırmayın.
10. Profil formunda e-postayı salt okunur gösterin ve güncelleme isteğine eklemeyin.

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
- Parola değiştirme veya sıfırlama
- Refresh token
- Server-side logout veya token iptali
- Yönetici paneli
- Rezervasyon kodu
- Başka kullanıcıların rezervasyonlarını listeleme

İstemciler bu özellikler için endpoint çağrısı yapmamalıdır.
