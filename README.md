# SOS DAO

SOS DAO, topluluk fonlarının şeffaf şekilde yönetilmesi ve bağış süreçlerinin zincir üstünde izlenmesi için geliştirilmiş bir platformdur.

## Proje Özeti

Bu repo 3 ana parçadan oluşur:

- `main/`: Akıllı kontratlar (Hardhat)
- `ui/sosdao-ui-main/`: Web arayüzü (React + Redux + Wagmi)
- `ui/sosdao-backend-master/`: API ve indexer servisleri (NestJS)

Sistem, fon havuzlarına bağış yapılmasını, işlemlerin zincirden okunmasını ve bağışlara ait NFT mint akışını destekler.

## Mimari

### 1. Smart Contracts (`main/`)

Temel kontratlar:

- `PoolManager`: Yeni havuz (pool) oluşturur
- `Pool`: Fon kabulü ve havuz yönetimi
- `Vault`: Çok imzalı işlem akışı
- `Mint`: Bağışlara karşılık NFT üretimi
- `Registry`: Kontrat adres kayıtları
- `Authority`: Rol ve erişim kontrolü
- `RequestManager`: Havuz harcama/istek yönetimi

Teknolojiler:

- Hardhat
- OpenZeppelin Contracts
- UUPS upgradeable pattern

### 2. Frontend (`ui/sosdao-ui-main/`)

Frontend tarafı:

- Cüzdan bağlantısı
- Havuz listeleme ve detaylar
- Bağış gönderme (native + ERC20)
- NFT görüntüleme
- Zincir üstü işlem linkleri

Teknolojiler:

- React
- Redux + Redux-Saga
- Wagmi / Ethers
- Bootstrap

### 3. Backend (`ui/sosdao-backend-master/`)

Backend tarafı:

- Fon, bağış ve NFT verilerini zincirden toplayıp API olarak sunar
- Düzenli cron senkronizasyonu ile event/log indexleme yapar

Teknolojiler:

- NestJS
- Ethers
- Axios

## Klasör Yapısı

```text
sos dao/
├─ main/                      # smart contracts
├─ ui/
│  ├─ sosdao-ui-main/         # frontend
│  └─ sosdao-backend-master/  # backend
└─ README.md
```

## Kurulum

Her alt proje kendi bağımlılıklarına sahiptir.

### Smart Contracts

```bash
cd main
npm install
```

### Frontend

```bash
cd ui/sosdao-ui-main
npm install
```

### Backend

```bash
cd ui/sosdao-backend-master
npm install
```

## Çalıştırma

### Smart Contracts

```bash
cd main
npm run test
```

> Not: `main/package.json` içinde varsayılan script `compile` değil, test/lint/coverage scriptleri tanımlıdır.

### Frontend

```bash
cd ui/sosdao-ui-main
npm run start
```

### Backend

```bash
cd ui/sosdao-backend-master
npm run start:dev
```

## Ortam Değişkenleri

Frontend ve backend tarafında ağ, kontrat adresi ve provider bilgileri için `.env` dosyaları kullanılır.

Özellikle:

- Registry kontrat adresi
- RPC endpoint
- WalletConnect project id

## Notlar

- Proje adı ve markalama **SOS DAO** olarak güncellenmiştir.
- Akışta `Mint` kontratı NFT üretimi için kullanılır.
- Ağ bağlantı URL’leri (`haqq` endpointleri) zincir erişimi için korunmuştur.

## Lisans

Bu repository içindeki alt projeler kendi lisans dosyalarına/satırlarına göre değerlendirilmelidir.
