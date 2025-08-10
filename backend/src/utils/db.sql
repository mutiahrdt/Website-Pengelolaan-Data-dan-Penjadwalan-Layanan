-- ==============================================================
-- SKRIP DATABASE LENGKAP & FINAL
-- ==============================================================

-- Hapus tabel dalam urutan yang benar untuk menghindari error FK
DROP TABLE IF EXISTS TRANSAKSI_HARIAN CASCADE;
DROP TABLE IF EXISTS JADWAL CASCADE;
DROP TABLE IF EXISTS PESANAN CASCADE;
DROP TABLE IF EXISTS KEHADIRAN CASCADE;
DROP TABLE IF EXISTS JAM_KERJA CASCADE;
DROP TABLE IF EXISTS SIF CASCADE;
DROP TABLE IF EXISTS ALOKASI_TERAPIS CASCADE;
DROP TABLE IF EXISTS SESI_RUANGAN CASCADE;
DROP TABLE IF EXISTS SESI CASCADE;
DROP TABLE IF EXISTS ALOKASI_ADMIN CASCADE;
DROP TABLE IF EXISTS HARGA_PAKET CASCADE;
DROP TABLE IF EXISTS RUANGAN CASCADE;
DROP TABLE IF EXISTS PAKET CASCADE;
DROP TABLE IF EXISTS KEAHLIAN_TERAPIS CASCADE;
DROP TABLE IF EXISTS KEAHLIAN CASCADE;
DROP TABLE IF EXISTS TERAPIS CASCADE;
DROP TABLE IF EXISTS PASIEN CASCADE;
DROP TABLE IF EXISTS ADMINISTRATIF CASCADE;
DROP TABLE IF EXISTS CABANG CASCADE;
DROP TABLE IF EXISTS REFERENSI_FORM CASCADE;

/*==============================================================*/
/* Table: CABANG                                                */
/*==============================================================*/
CREATE TABLE CABANG (
   ID_CABANG            CHAR(2)     NOT NULL,
   NAMA_CABANG          VARCHAR(20) NOT NULL,
   ALAMAT_CABANG        TEXT        NOT NULL,
   STATUS_CABANG        BOOL        NOT NULL,
   FOTO_CABANG          VARCHAR(60) NOT NULL,
   CONSTRAINT PK_CABANG PRIMARY KEY (ID_CABANG)
);

/*==============================================================*/
/* Table: ADMINISTRATIF                                         */
/*==============================================================*/
CREATE TABLE ADMINISTRATIF (
   ID_ADMINISTRATIF     CHAR(4)      NOT NULL,
   USERNAME             CHAR(15)     NOT NULL UNIQUE,
   PASSWORD             VARCHAR(100) NOT NULL,
   FOTO_ADMIN           VARCHAR(60)  NOT NULL,
   NAMA_ADMIN           VARCHAR(50)  NOT NULL,
   INISIAL_ADMIN        CHAR(2)      NOT NULL,
   NAMA_ROLE            VARCHAR(11)  NOT NULL,
   STATUS_ADMIN         BOOL         NOT NULL,
   CONSTRAINT PK_ADMINISTRATIF PRIMARY KEY (ID_ADMINISTRATIF)
);

/*==============================================================*/
/* Table: PASIEN                                                */
/*==============================================================*/
CREATE TABLE PASIEN (
   ID_PASIEN            CHAR(10)    NOT NULL,
   NAMA_PASIEN          VARCHAR(50) NOT NULL,
   NO_HP_PASIEN         VARCHAR(13) NOT NULL,
   GENDER_PASIEN        CHAR(1)     NOT NULL,
   TANGGAL_LAHIR        DATE        NOT NULL,
   CONSTRAINT PK_PASIEN PRIMARY KEY (ID_PASIEN)
);

/*==============================================================*/
/* Table: TERAPIS                                               */
/*==============================================================*/
CREATE TABLE TERAPIS (
   ID_TERAPIS           CHAR(3)     NOT NULL,
   NO_HP_TERAPIS        VARCHAR(13) NOT NULL,
   FOTO_TERAPIS         VARCHAR(60) NOT NULL,
   NAMA_TERAPIS         VARCHAR(50) NOT NULL,
   GENDER_TERAPIS       CHAR(1)     NOT NULL,
   INISIAL_TERAPIS      VARCHAR(2)  NOT NULL,
   STATUS_TERAPIS       BOOL        NOT NULL,
   CONSTRAINT PK_TERAPIS PRIMARY KEY (ID_TERAPIS)
);

/*==============================================================*/
/* Table: KEAHLIAN                                              */
/*==============================================================*/
CREATE TABLE KEAHLIAN (
   ID_KEAHLIAN          CHAR(3)     NOT NULL,
   NAMA_KEAHLIAN        VARCHAR(50) NOT NULL,
   STATUS_KEAHLIAN      BOOL        NOT NULL,
   CONSTRAINT PK_KEAHLIAN PRIMARY KEY (ID_KEAHLIAN)
);

/*==============================================================*/
/* Table: KEAHLIAN_TERAPIS                                      */
/*==============================================================*/
CREATE TABLE KEAHLIAN_TERAPIS (
   ID_KEAHLIAN            CHAR(3) NOT NULL,
   ID_TERAPIS             CHAR(3) NOT NULL,
   STATUS_KEAHLIAN_TERAPIS BOOL    NOT NULL,
   CONSTRAINT PK_KEAHLIAN_TERAPIS PRIMARY KEY (ID_KEAHLIAN, ID_TERAPIS),
   CONSTRAINT FK_KEAHLIAN_MENGGUNAK_KEAHLIAN FOREIGN KEY (ID_KEAHLIAN)
      REFERENCES KEAHLIAN (ID_KEAHLIAN) ON DELETE RESTRICT ON UPDATE RESTRICT,
   CONSTRAINT FK_KEAHLIAN_MENGUASAI_TERAPIS FOREIGN KEY (ID_TERAPIS)
      REFERENCES TERAPIS (ID_TERAPIS) ON DELETE RESTRICT ON UPDATE RESTRICT
);

/*==============================================================*/
/* Table: PAKET                                                 */
/*==============================================================*/
CREATE TABLE PAKET (
   ID_PAKET             CHAR(5)     NOT NULL,
   ID_KEAHLIAN          CHAR(3)     NOT NULL,
   NAMA_PAKET           VARCHAR(60) NOT NULL,
   DESKRIPSI_PAKET      TEXT        NULL,
   KATA_KUNCI           TEXT        NULL,
   GAMBAR_PAKET         VARCHAR(60) NOT NULL,
   DURASI_PAKET         NUMERIC     NOT NULL,
   STATUS_PAKET         BOOL        NOT NULL,
   CONSTRAINT PK_PAKET PRIMARY KEY (ID_PAKET),
   CONSTRAINT FK_PAKET_MEMBUTUHK_KEAHLIAN FOREIGN KEY (ID_KEAHLIAN)
      REFERENCES KEAHLIAN (ID_KEAHLIAN) ON DELETE RESTRICT ON UPDATE RESTRICT
);

/*==============================================================*/
/* Table: RUANGAN                                               */
/*==============================================================*/
CREATE TABLE RUANGAN (
   ID_RUANGAN           CHAR(4)     NOT NULL,
   ID_CABANG            CHAR(2)     NOT NULL,
   STATUS_RUANGAN       BOOL        NOT NULL,
   NAMA_RUANGAN         VARCHAR(20) NOT NULL,
   CONSTRAINT PK_RUANGAN PRIMARY KEY (ID_RUANGAN),
   CONSTRAINT FK_RUANGAN_MEMILIKI_CABANG FOREIGN KEY (ID_CABANG)
      REFERENCES CABANG (ID_CABANG) ON DELETE RESTRICT ON UPDATE RESTRICT
);

/*==============================================================*/
/* Table: HARGA_PAKET                                           */
/*==============================================================*/
CREATE TABLE HARGA_PAKET (
   ID_CABANG            CHAR(2)     NOT NULL,
   ID_PAKET             CHAR(5)     NOT NULL,
   STATUS_HARGA_PAKET   BOOL        NOT NULL,
   WAKTU_BERLAKU        TIMESTAMPTZ NOT NULL,
   HARGA_PAKET          MONEY       NOT NULL,
   CONSTRAINT PK_HARGA_PAKET PRIMARY KEY (ID_CABANG, ID_PAKET, WAKTU_BERLAKU),
   CONSTRAINT FK_HARGA_PA_MEMBERIKA_CABANG FOREIGN KEY (ID_CABANG)
      REFERENCES CABANG (ID_CABANG) ON DELETE RESTRICT ON UPDATE RESTRICT,
   CONSTRAINT FK_HARGA_PA_MENGHARGA_PAKET FOREIGN KEY (ID_PAKET)
      REFERENCES PAKET (ID_PAKET) ON DELETE RESTRICT ON UPDATE RESTRICT
);

/*==============================================================*/
/* Table: ALOKASI_ADMIN                                         */
/*==============================================================*/
CREATE TABLE ALOKASI_ADMIN (
   ID_ADMINISTRATIF     CHAR(4)      NOT NULL,
   ID_CABANG            CHAR(2)      NOT NULL,
   STATUS_ALOKASI       BOOL         NOT NULL,
   WAKTU_BERLAKU        TIMESTAMPTZ  NOT NULL,
   CONSTRAINT PK_ALOKASI_ADMIN PRIMARY KEY (ID_ADMINISTRATIF, ID_CABANG, WAKTU_BERLAKU),
   CONSTRAINT FK_ALOKASI__BERAFILIA_CABANG FOREIGN KEY (ID_CABANG)
      REFERENCES CABANG (ID_CABANG) ON DELETE RESTRICT ON UPDATE RESTRICT,
   CONSTRAINT FK_ALOKASI__MENGALOKA_ADMINIST FOREIGN KEY (ID_ADMINISTRATIF)
      REFERENCES ADMINISTRATIF (ID_ADMINISTRATIF) ON DELETE RESTRICT ON UPDATE RESTRICT
);

/*==============================================================*/
/* Table: SESI                                                  */
/*==============================================================*/
CREATE TABLE SESI (
   ID_SESI              CHAR(3)     NOT NULL,
   NAMA_SESI            VARCHAR(7)  NOT NULL,
   JAM_MULAI            TIME        NOT NULL,
   JAM_SELESAI          TIME        NOT NULL,
   ID_CABANG            CHAR(2)     NOT NULL,
   STATUS_SESI          BOOL        NOT NULL,
   CONSTRAINT PK_SESI PRIMARY KEY (ID_SESI),
   CONSTRAINT FK_SESI_MENGADAKA_CABANG FOREIGN KEY (ID_CABANG)
      REFERENCES CABANG (ID_CABANG) ON DELETE RESTRICT ON UPDATE RESTRICT
);

/*==============================================================*/
/* Table: SESI_RUANGAN                                          */
/*==============================================================*/
CREATE TABLE SESI_RUANGAN (
   ID_SESI              CHAR(3) NOT NULL,
   ID_RUANGAN           CHAR(4) NOT NULL,
   CONSTRAINT PK_SESI_RUANGAN PRIMARY KEY (ID_SESI, ID_RUANGAN),
   CONSTRAINT FK_SESI_RUA_MEMERLUKA_SESI FOREIGN KEY (ID_SESI)
      REFERENCES SESI (ID_SESI) ON DELETE RESTRICT ON UPDATE RESTRICT,  
   CONSTRAINT FK_SESI_RUA_MENGISI_RUANGAN FOREIGN KEY (ID_RUANGAN)
      REFERENCES RUANGAN (ID_RUANGAN) ON DELETE RESTRICT ON UPDATE RESTRICT
);

/*==============================================================*/
/* Table: ALOKASI_TERAPIS                                       */
/*==============================================================*/
CREATE TABLE ALOKASI_TERAPIS (
   ID_TERAPIS           CHAR(3)     NOT NULL,
   ID_CABANG            CHAR(2)     NOT NULL,
   WAKTU_BERLAKU        TIMESTAMPTZ NOT NULL,
   STATUS_ALOKASI       BOOL        NOT NULL,
   CONSTRAINT PK_ALOKASI_TERAPIS PRIMARY KEY (ID_TERAPIS, ID_CABANG, WAKTU_BERLAKU),
   CONSTRAINT FK_ALOKASI__BEKERJA_D_TERAPIS FOREIGN KEY (ID_TERAPIS)
      REFERENCES TERAPIS (ID_TERAPIS) ON DELETE RESTRICT ON UPDATE RESTRICT,
   CONSTRAINT FK_ALOKASI__MENEMPATK_CABANG FOREIGN KEY (ID_CABANG)
      REFERENCES CABANG (ID_CABANG) ON DELETE RESTRICT ON UPDATE RESTRICT
);

/*==============================================================*/
/* Table: SIF                                                   */
/*==============================================================*/
CREATE TABLE SIF (
   ID_SIF               CHAR(1)     NOT NULL,
   NAMA_SIF             VARCHAR(10) NOT NULL,
   JAM_MULAI            TIME        NOT NULL,
   JAM_SELESAI          TIME        NOT NULL,
   STATUS_SIF           BOOL        NOT NULL,
   CONSTRAINT PK_SIF PRIMARY KEY (ID_SIF)
);

/*==============================================================*/
/* Table: JAM_KERJA                                             */
/*==============================================================*/
CREATE TABLE JAM_KERJA (
   ID_TERAPIS           CHAR(3)     NOT NULL,
   ID_SIF               CHAR(1)     NOT NULL,
   HARI_KERJA           VARCHAR(6)  NOT NULL,
   KUOTA_JAM_KERJA      SMALLINT    NOT NULL,
   TRIWULAN             CHAR(6)     NOT NULL,
   STATUS_BEKERJA       BOOL        NOT NULL,
   CONSTRAINT PK_JAM_KERJA PRIMARY KEY (ID_TERAPIS, ID_SIF, HARI_KERJA, TRIWULAN),
   CONSTRAINT FK_JAM_KERJ_BEKERJA_TERAPIS FOREIGN KEY (ID_TERAPIS)
      REFERENCES TERAPIS (ID_TERAPIS) ON DELETE RESTRICT ON UPDATE RESTRICT,
   CONSTRAINT FK_JAM_KERJ_BERGANTUN_SIF FOREIGN KEY (ID_SIF)
      REFERENCES SIF (ID_SIF) ON DELETE RESTRICT ON UPDATE RESTRICT
);

/*==============================================================*/
/* Table: KEHADIRAN                                             */
/*==============================================================*/
CREATE TABLE KEHADIRAN (
   TANGGAL_KEHADIRAN    DATE         NOT NULL,
   ID_TERAPIS           CHAR(3)      NOT NULL,
   ID_SIF               CHAR(1)      NOT NULL,
   HARI_KERJA           VARCHAR(6)   NOT NULL,
   TRIWULAN             CHAR(6)      NOT NULL,
   STATUS_KEHADIRAN     BOOL         NOT NULL,
   WAKTU_KEHADIRAN      TIME         NULL,
   KETERANGAN_KEHADIRAN VARCHAR(50)  NULL,
   CONSTRAINT PK_KEHADIRAN PRIMARY KEY (TANGGAL_KEHADIRAN, ID_TERAPIS),
   CONSTRAINT FK_KEHADIRAN_MENCATAT_JAM_KERJA FOREIGN KEY (ID_TERAPIS, ID_SIF, HARI_KERJA, TRIWULAN)
      REFERENCES JAM_KERJA (ID_TERAPIS, ID_SIF, HARI_KERJA, TRIWULAN) ON DELETE RESTRICT ON UPDATE RESTRICT
);

/*==============================================================*/
/* Table: PESANAN                                               */
/*==============================================================*/
CREATE TABLE PESANAN (
   ID_PESANAN           CHAR(10)    NOT NULL,
   ID_PAKET             CHAR(5)     NOT NULL,
   ID_PASIEN            CHAR(10)    NOT NULL,
   ID_ADMINISTRATIF     CHAR(4)     NOT NULL,
   WAKTU_TEMPUH         NUMERIC     NULL,
   JENIS_RUANGAN        VARCHAR(8)  NOT NULL,
   PREFERENSI_NAMA_TERAPIS VARCHAR(50) NULL,
   WAKTU_PIJAT          DATE        NOT NULL,
   PREFERENSI_GENDER_TERAPIS CHAR(1) NULL,
   CONSTRAINT PK_PESANAN PRIMARY KEY (ID_PESANAN),
   CONSTRAINT FK_PESANAN_MEMBUAT_ADMINIST FOREIGN KEY (ID_ADMINISTRATIF)
      REFERENCES ADMINISTRATIF (ID_ADMINISTRATIF) ON DELETE RESTRICT ON UPDATE RESTRICT,
   CONSTRAINT FK_PESANAN_MEMESAN_PASIEN FOREIGN KEY (ID_PASIEN)
      REFERENCES PASIEN (ID_PASIEN) ON DELETE RESTRICT ON UPDATE RESTRICT,
   CONSTRAINT FK_PESANAN_MEMILIH_PAKET FOREIGN KEY (ID_PAKET)
      REFERENCES PAKET (ID_PAKET) ON DELETE RESTRICT ON UPDATE RESTRICT
);

/*==============================================================*/
/* Table: JADWAL (DIPERBAIKI)                                   */
/*==============================================================*/
CREATE TABLE JADWAL (
   ID_TERAPIS           CHAR(3)     NOT NULL,
   TANGGAL_KEHADIRAN    DATE        NOT NULL,
   ID_SESI              CHAR(3)     NOT NULL,
   ID_RUANGAN           CHAR(4)     NOT NULL,
   ID_SIF               CHAR(1)     NOT NULL,
   ID_PESANAN           CHAR(10)    NOT NULL,
   STATUS_JADWAL        VARCHAR(20) NOT NULL,
   CONSTRAINT PK_JADWAL PRIMARY KEY (ID_TERAPIS, TANGGAL_KEHADIRAN, ID_SESI, ID_RUANGAN, ID_SIF, ID_PESANAN),
   CONSTRAINT FK_JADWAL_MENCIPTAK_PESANAN FOREIGN KEY (ID_PESANAN)
      REFERENCES PESANAN (ID_PESANAN) ON DELETE RESTRICT ON UPDATE RESTRICT,
   CONSTRAINT FK_JADWAL_MENEMPATI_SESI_RUA FOREIGN KEY (ID_SESI, ID_RUANGAN)
      REFERENCES SESI_RUANGAN (ID_SESI, ID_RUANGAN) ON DELETE RESTRICT ON UPDATE RESTRICT,
   CONSTRAINT FK_JADWAL_TERIKAT_KEHADIRAN FOREIGN KEY (ID_TERAPIS, TANGGAL_KEHADIRAN)
      REFERENCES KEHADIRAN (ID_TERAPIS, TANGGAL_KEHADIRAN) ON DELETE RESTRICT ON UPDATE RESTRICT
);

/*==============================================================*/
/* Table: REFERENSI_FORM                                        */
/*==============================================================*/
CREATE TABLE REFERENSI_FORM (
   ID_FORM              CHAR(7)     NOT NULL,
   NAMA_FORM            VARCHAR(30) NOT NULL,
   SATUAN               VARCHAR(10) NOT NULL,
   TIPE_DATA            VARCHAR(15) NOT NULL,
   CONSTRAINT PK_REFERENSI_FORM PRIMARY KEY (ID_FORM)
);

/*==============================================================*/
/* Table: TRANSAKSI_HARIAN (DIPERBAIKI)                         */
/*==============================================================*/
CREATE TABLE TRANSAKSI_HARIAN (
   ID_TERAPIS           CHAR(3)     NOT NULL,
   TANGGAL_KEHADIRAN    DATE        NOT NULL,
   ID_SESI              CHAR(3)     NOT NULL,
   ID_RUANGAN           CHAR(4)     NOT NULL,
   ID_SIF               CHAR(1)     NOT NULL,
   ID_PESANAN           CHAR(10)    NOT NULL,
   ID_FORM              CHAR(7)     NOT NULL,
   NILAI_NUMERIK        SMALLINT    NULL,
   NILAI_CHAR           TEXT        NULL,
   STATUS_SIMPAN        BOOL        NOT NULL,
   CONSTRAINT PK_TRANSAKSI_HARIAN PRIMARY KEY (ID_TERAPIS, TANGGAL_KEHADIRAN, ID_SESI, ID_RUANGAN, ID_SIF, ID_PESANAN, ID_FORM),
   CONSTRAINT FK_TRANSAKS_MENGHASIL_REFERENS FOREIGN KEY (ID_FORM)
      REFERENCES REFERENSI_FORM (ID_FORM) ON DELETE RESTRICT ON UPDATE RESTRICT,
   CONSTRAINT FK_TRANSAKS_MENYIMPAN_JADWAL FOREIGN KEY (ID_TERAPIS, TANGGAL_KEHADIRAN, ID_SESI, ID_RUANGAN, ID_SIF, ID_PESANAN)
      REFERENCES JADWAL (ID_TERAPIS, TANGGAL_KEHADIRAN, ID_SESI, ID_RUANGAN, ID_SIF, ID_PESANAN) ON DELETE RESTRICT ON UPDATE RESTRICT
);