-- Import data AGX Mariage
-- Execute in Supabase SQL Editor
-- Generated on 2026-02-10

DO $$
DECLARE
  v_c1 UUID; v_c2 UUID; v_c3 UUID; v_c4 UUID; v_c5 UUID;
  v_c6 UUID; v_c7 UUID; v_c8 UUID; v_c9 UUID; v_c10 UUID;
  v_c11 UUID; v_c12 UUID; v_c13 UUID; v_c14 UUID; v_c15 UUID;
  v_c16 UUID; v_c17 UUID; v_c18 UUID; v_c19 UUID; v_c20 UUID;
  v_c21 UUID; v_c22 UUID; v_c23 UUID; v_c24 UUID; v_c25 UUID;
  v_c26 UUID; v_c27 UUID; v_c28 UUID; v_c29 UUID; v_c30 UUID;
  v_c31 UUID; v_c32 UUID; v_c33 UUID; v_c34 UUID; v_c35 UUID;
  v_c36 UUID; v_c37 UUID; v_c38 UUID; v_c39 UUID; v_c40 UUID;
  v_c41 UUID; v_c42 UUID;
  v_exists BOOLEAN;
BEGIN

  -- ============================================================
  -- CLIENTS (42 rows)
  -- ============================================================

  -- Client 1: AYARI HAJER
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='AYARI' AND prenom_marie_1='HAJER' AND date_mariage='2026-01-10') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('AYARI', 'HAJER', '2026-01-10', '2025-12-27', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c1;
  ELSE
    SELECT id INTO v_c1 FROM clients WHERE nom_marie_1='AYARI' AND prenom_marie_1='HAJER' AND date_mariage='2026-01-10' LIMIT 1;
  END IF;

  -- Client 2: MCHIRI KARIM
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='MCHIRI' AND prenom_marie_1='KARIM' AND date_mariage='2026-01-11') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('MCHIRI', 'KARIM', '2026-01-11', '2025-12-22', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c2;
  ELSE
    SELECT id INTO v_c2 FROM clients WHERE nom_marie_1='MCHIRI' AND prenom_marie_1='KARIM' AND date_mariage='2026-01-11' LIMIT 1;
  END IF;

  -- Client 3: SALHI MEHREZ (bad inscription date, use NULL)
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='SALHI' AND prenom_marie_1='MEHREZ' AND date_mariage='2026-02-06') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('SALHI', 'MEHREZ', '2026-02-06', NULL, 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c3;
  ELSE
    SELECT id INTO v_c3 FROM clients WHERE nom_marie_1='SALHI' AND prenom_marie_1='MEHREZ' AND date_mariage='2026-02-06' LIMIT 1;
  END IF;

  -- Client 4: YOUSSEF BEDAOUI (statut annule)
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='YOUSSEF' AND prenom_marie_1='BEDAOUI' AND date_mariage='2026-02-07') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('YOUSSEF', 'BEDAOUI', '2026-02-07', '2021-06-20', 'annule', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c4;
  ELSE
    SELECT id INTO v_c4 FROM clients WHERE nom_marie_1='YOUSSEF' AND prenom_marie_1='BEDAOUI' AND date_mariage='2026-02-07' LIMIT 1;
  END IF;

  -- Client 5: KANOU HATEM
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='KANOU' AND prenom_marie_1='HATEM' AND date_mariage='2026-03-26') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('KANOU', 'HATEM', '2026-03-26', '2025-12-22', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c5;
  ELSE
    SELECT id INTO v_c5 FROM clients WHERE nom_marie_1='KANOU' AND prenom_marie_1='HATEM' AND date_mariage='2026-03-26' LIMIT 1;
  END IF;

  -- Client 6: BAZIZ MOENES
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='BAZIZ' AND prenom_marie_1='MOENES' AND date_mariage='2026-03-28') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('BAZIZ', 'MOENES', '2026-03-28', '2025-06-21', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c6;
  ELSE
    SELECT id INTO v_c6 FROM clients WHERE nom_marie_1='BAZIZ' AND prenom_marie_1='MOENES' AND date_mariage='2026-03-28' LIMIT 1;
  END IF;

  -- Client 7: TEMIM ABIR
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='TEMIM' AND prenom_marie_1='ABIR' AND date_mariage='2026-03-29') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('TEMIM', 'ABIR', '2026-03-29', '2025-08-17', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c7;
  ELSE
    SELECT id INTO v_c7 FROM clients WHERE nom_marie_1='TEMIM' AND prenom_marie_1='ABIR' AND date_mariage='2026-03-29' LIMIT 1;
  END IF;

  -- Client 8: BAHRI MOOTAZ
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='BAHRI' AND prenom_marie_1='MOOTAZ' AND date_mariage='2026-04-04') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('BAHRI', 'MOOTAZ', '2026-04-04', '2025-04-26', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c8;
  ELSE
    SELECT id INTO v_c8 FROM clients WHERE nom_marie_1='BAHRI' AND prenom_marie_1='MOOTAZ' AND date_mariage='2026-04-04' LIMIT 1;
  END IF;

  -- Client 9: OURTANI MOHAMED
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='OURTANI' AND prenom_marie_1='MOHAMED' AND date_mariage='2026-04-12') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('OURTANI', 'MOHAMED', '2026-04-12', '2026-01-08', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c9;
  ELSE
    SELECT id INTO v_c9 FROM clients WHERE nom_marie_1='OURTANI' AND prenom_marie_1='MOHAMED' AND date_mariage='2026-04-12' LIMIT 1;
  END IF;

  -- Client 10: CHIKHAOUI SARRA
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='CHIKHAOUI' AND prenom_marie_1='SARRA' AND date_mariage='2026-06-02') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('CHIKHAOUI', 'SARRA', '2026-06-02', '2025-10-31', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c10;
  ELSE
    SELECT id INTO v_c10 FROM clients WHERE nom_marie_1='CHIKHAOUI' AND prenom_marie_1='SARRA' AND date_mariage='2026-06-02' LIMIT 1;
  END IF;

  -- Client 11: KILANI MONDHER
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='KILANI' AND prenom_marie_1='MONDHER' AND date_mariage='2026-06-03') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('KILANI', 'MONDHER', '2026-06-03', '2024-10-22', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c11;
  ELSE
    SELECT id INTO v_c11 FROM clients WHERE nom_marie_1='KILANI' AND prenom_marie_1='MONDHER' AND date_mariage='2026-06-03' LIMIT 1;
  END IF;

  -- Client 12: OPTION RIHAB (no inscription date, no contrat)
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='OPTION' AND prenom_marie_1='RIHAB' AND date_mariage='2026-06-19') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('OPTION', 'RIHAB', '2026-06-19', NULL, 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c12;
  ELSE
    SELECT id INTO v_c12 FROM clients WHERE nom_marie_1='OPTION' AND prenom_marie_1='RIHAB' AND date_mariage='2026-06-19' LIMIT 1;
  END IF;

  -- Client 13: TALBI MOUNIRA
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='TALBI' AND prenom_marie_1='MOUNIRA' AND date_mariage='2026-06-20') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('TALBI', 'MOUNIRA', '2026-06-20', '2025-08-25', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c13;
  ELSE
    SELECT id INTO v_c13 FROM clients WHERE nom_marie_1='TALBI' AND prenom_marie_1='MOUNIRA' AND date_mariage='2026-06-20' LIMIT 1;
  END IF;

  -- Client 14: HAMAMI AYOUB
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='HAMAMI' AND prenom_marie_1='AYOUB' AND date_mariage='2026-06-21') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('HAMAMI', 'AYOUB', '2026-06-21', '2025-12-27', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c14;
  ELSE
    SELECT id INTO v_c14 FROM clients WHERE nom_marie_1='HAMAMI' AND prenom_marie_1='AYOUB' AND date_mariage='2026-06-21' LIMIT 1;
  END IF;

  -- Client 15: BEN ZINA WALID
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='BEN' AND prenom_marie_1='ZINA WALID' AND date_mariage='2026-06-27') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('BEN', 'ZINA WALID', '2026-06-27', '2026-01-11', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c15;
  ELSE
    SELECT id INTO v_c15 FROM clients WHERE nom_marie_1='BEN' AND prenom_marie_1='ZINA WALID' AND date_mariage='2026-06-27' LIMIT 1;
  END IF;

  -- Client 16: REBAH NAJET
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='REBAH' AND prenom_marie_1='NAJET' AND date_mariage='2026-07-10') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('REBAH', 'NAJET', '2026-07-10', '2025-09-18', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c16;
  ELSE
    SELECT id INTO v_c16 FROM clients WHERE nom_marie_1='REBAH' AND prenom_marie_1='NAJET' AND date_mariage='2026-07-10' LIMIT 1;
  END IF;

  -- Client 17: ARFAOUI FAHMI
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='ARFAOUI' AND prenom_marie_1='FAHMI' AND date_mariage='2026-07-11') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('ARFAOUI', 'FAHMI', '2026-07-11', '2025-07-31', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c17;
  ELSE
    SELECT id INTO v_c17 FROM clients WHERE nom_marie_1='ARFAOUI' AND prenom_marie_1='FAHMI' AND date_mariage='2026-07-11' LIMIT 1;
  END IF;

  -- Client 18: DRIDI AMANI
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='DRIDI' AND prenom_marie_1='AMANI' AND date_mariage='2026-07-12') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('DRIDI', 'AMANI', '2026-07-12', '2025-12-16', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c18;
  ELSE
    SELECT id INTO v_c18 FROM clients WHERE nom_marie_1='DRIDI' AND prenom_marie_1='AMANI' AND date_mariage='2026-07-12' LIMIT 1;
  END IF;

  -- Client 19: AYARI CHIRAZ
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='AYARI' AND prenom_marie_1='CHIRAZ' AND date_mariage='2026-07-16') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('AYARI', 'CHIRAZ', '2026-07-16', '2025-07-24', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c19;
  ELSE
    SELECT id INTO v_c19 FROM clients WHERE nom_marie_1='AYARI' AND prenom_marie_1='CHIRAZ' AND date_mariage='2026-07-16' LIMIT 1;
  END IF;

  -- Client 20: EL MDINI AMAL
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='EL' AND prenom_marie_1='MDINI AMAL' AND date_mariage='2026-07-17') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('EL', 'MDINI AMAL', '2026-07-17', '2026-01-19', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c20;
  ELSE
    SELECT id INTO v_c20 FROM clients WHERE nom_marie_1='EL' AND prenom_marie_1='MDINI AMAL' AND date_mariage='2026-07-17' LIMIT 1;
  END IF;

  -- Client 21: CHALBI YACINE
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='CHALBI' AND prenom_marie_1='YACINE' AND date_mariage='2026-07-18') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('CHALBI', 'YACINE', '2026-07-18', '2025-09-13', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c21;
  ELSE
    SELECT id INTO v_c21 FROM clients WHERE nom_marie_1='CHALBI' AND prenom_marie_1='YACINE' AND date_mariage='2026-07-18' LIMIT 1;
  END IF;

  -- Client 22: REZGUI FATIMA ZOHRA
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='REZGUI' AND prenom_marie_1='FATIMA ZOHRA' AND date_mariage='2026-07-19') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('REZGUI', 'FATIMA ZOHRA', '2026-07-19', '2026-01-24', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c22;
  ELSE
    SELECT id INTO v_c22 FROM clients WHERE nom_marie_1='REZGUI' AND prenom_marie_1='FATIMA ZOHRA' AND date_mariage='2026-07-19' LIMIT 1;
  END IF;

  -- Client 23: GHRAB AMAL
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='GHRAB' AND prenom_marie_1='AMAL' AND date_mariage='2026-07-23') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('GHRAB', 'AMAL', '2026-07-23', '2026-01-24', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c23;
  ELSE
    SELECT id INTO v_c23 FROM clients WHERE nom_marie_1='GHRAB' AND prenom_marie_1='AMAL' AND date_mariage='2026-07-23' LIMIT 1;
  END IF;

  -- Client 24: ROMDHANE NAJLA
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='ROMDHANE' AND prenom_marie_1='NAJLA' AND date_mariage='2026-07-31') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('ROMDHANE', 'NAJLA', '2026-07-31', '2025-09-12', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c24;
  ELSE
    SELECT id INTO v_c24 FROM clients WHERE nom_marie_1='ROMDHANE' AND prenom_marie_1='NAJLA' AND date_mariage='2026-07-31' LIMIT 1;
  END IF;

  -- Client 25: SAMI (empty prenom)
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='SAMI' AND prenom_marie_1='' AND date_mariage='2026-08-03') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('SAMI', '', '2026-08-03', NULL, 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c25;
  ELSE
    SELECT id INTO v_c25 FROM clients WHERE nom_marie_1='SAMI' AND prenom_marie_1='' AND date_mariage='2026-08-03' LIMIT 1;
  END IF;

  -- Client 26: ALI BEJAOUI
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='ALI' AND prenom_marie_1='BEJAOUI' AND date_mariage='2026-08-04') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('ALI', 'BEJAOUI', '2026-08-04', NULL, 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c26;
  ELSE
    SELECT id INTO v_c26 FROM clients WHERE nom_marie_1='ALI' AND prenom_marie_1='BEJAOUI' AND date_mariage='2026-08-04' LIMIT 1;
  END IF;

  -- Client 27: ZAGHOUANI AHMED
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='ZAGHOUANI' AND prenom_marie_1='AHMED' AND date_mariage='2026-08-05') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('ZAGHOUANI', 'AHMED', '2026-08-05', '2025-12-19', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c27;
  ELSE
    SELECT id INTO v_c27 FROM clients WHERE nom_marie_1='ZAGHOUANI' AND prenom_marie_1='AHMED' AND date_mariage='2026-08-05' LIMIT 1;
  END IF;

  -- Client 28: BOUAOUN YOUNES
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='BOUAOUN' AND prenom_marie_1='YOUNES' AND date_mariage='2026-08-06') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('BOUAOUN', 'YOUNES', '2026-08-06', '2025-10-30', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c28;
  ELSE
    SELECT id INTO v_c28 FROM clients WHERE nom_marie_1='BOUAOUN' AND prenom_marie_1='YOUNES' AND date_mariage='2026-08-06' LIMIT 1;
  END IF;

  -- Client 29: ALMI NADIA
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='ALMI' AND prenom_marie_1='NADIA' AND date_mariage='2026-08-07') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('ALMI', 'NADIA', '2026-08-07', '2025-09-23', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c29;
  ELSE
    SELECT id INTO v_c29 FROM clients WHERE nom_marie_1='ALMI' AND prenom_marie_1='NADIA' AND date_mariage='2026-08-07' LIMIT 1;
  END IF;

  -- Client 30: REZGUI AMIN ALLAH
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='REZGUI' AND prenom_marie_1='AMIN ALLAH' AND date_mariage='2026-08-08') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('REZGUI', 'AMIN ALLAH', '2026-08-08', '2025-08-21', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c30;
  ELSE
    SELECT id INTO v_c30 FROM clients WHERE nom_marie_1='REZGUI' AND prenom_marie_1='AMIN ALLAH' AND date_mariage='2026-08-08' LIMIT 1;
  END IF;

  -- Client 31: LACHHAB ZAHRA
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='LACHHAB' AND prenom_marie_1='ZAHRA' AND date_mariage='2026-08-09') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('LACHHAB', 'ZAHRA', '2026-08-09', '2025-08-28', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c31;
  ELSE
    SELECT id INTO v_c31 FROM clients WHERE nom_marie_1='LACHHAB' AND prenom_marie_1='ZAHRA' AND date_mariage='2026-08-09' LIMIT 1;
  END IF;

  -- Client 32: BEN SAID RAYEN
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='BEN' AND prenom_marie_1='SAID RAYEN' AND date_mariage='2026-08-10') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('BEN', 'SAID RAYEN', '2026-08-10', '2025-11-17', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c32;
  ELSE
    SELECT id INTO v_c32 FROM clients WHERE nom_marie_1='BEN' AND prenom_marie_1='SAID RAYEN' AND date_mariage='2026-08-10' LIMIT 1;
  END IF;

  -- Client 33: AMAR FETEN
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='AMAR' AND prenom_marie_1='FETEN' AND date_mariage='2026-08-13') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('AMAR', 'FETEN', '2026-08-13', '2026-01-27', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c33;
  ELSE
    SELECT id INTO v_c33 FROM clients WHERE nom_marie_1='AMAR' AND prenom_marie_1='FETEN' AND date_mariage='2026-08-13' LIMIT 1;
  END IF;

  -- Client 34: MANKEBI YOSRA
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='MANKEBI' AND prenom_marie_1='YOSRA' AND date_mariage='2026-08-14') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('MANKEBI', 'YOSRA', '2026-08-14', '2026-01-26', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c34;
  ELSE
    SELECT id INTO v_c34 FROM clients WHERE nom_marie_1='MANKEBI' AND prenom_marie_1='YOSRA' AND date_mariage='2026-08-14' LIMIT 1;
  END IF;

  -- Client 35: LABIDI SALOUA
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='LABIDI' AND prenom_marie_1='SALOUA' AND date_mariage='2026-08-15') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('LABIDI', 'SALOUA', '2026-08-15', '2025-08-27', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c35;
  ELSE
    SELECT id INTO v_c35 FROM clients WHERE nom_marie_1='LABIDI' AND prenom_marie_1='SALOUA' AND date_mariage='2026-08-15' LIMIT 1;
  END IF;

  -- Client 36: KHLIFI YOUSSEF
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='KHLIFI' AND prenom_marie_1='YOUSSEF' AND date_mariage='2026-08-16') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('KHLIFI', 'YOUSSEF', '2026-08-16', '2024-10-05', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c36;
  ELSE
    SELECT id INTO v_c36 FROM clients WHERE nom_marie_1='KHLIFI' AND prenom_marie_1='YOUSSEF' AND date_mariage='2026-08-16' LIMIT 1;
  END IF;

  -- Client 37: MAROUANI HENI
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='MAROUANI' AND prenom_marie_1='HENI' AND date_mariage='2026-08-22') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('MAROUANI', 'HENI', '2026-08-22', '2025-12-26', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c37;
  ELSE
    SELECT id INTO v_c37 FROM clients WHERE nom_marie_1='MAROUANI' AND prenom_marie_1='HENI' AND date_mariage='2026-08-22' LIMIT 1;
  END IF;

  -- Client 38: AKKAZ BAHRI
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='AKKAZ' AND prenom_marie_1='BAHRI' AND date_mariage='2026-08-23') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('AKKAZ', 'BAHRI', '2026-08-23', '2025-11-08', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c38;
  ELSE
    SELECT id INTO v_c38 FROM clients WHERE nom_marie_1='AKKAZ' AND prenom_marie_1='BAHRI' AND date_mariage='2026-08-23' LIMIT 1;
  END IF;

  -- Client 39: KAROUI AYDA
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='KAROUI' AND prenom_marie_1='AYDA' AND date_mariage='2026-09-03') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('KAROUI', 'AYDA', '2026-09-03', '2025-12-20', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c39;
  ELSE
    SELECT id INTO v_c39 FROM clients WHERE nom_marie_1='KAROUI' AND prenom_marie_1='AYDA' AND date_mariage='2026-09-03' LIMIT 1;
  END IF;

  -- Client 40: MAJDOUB SAMIA
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='MAJDOUB' AND prenom_marie_1='SAMIA' AND date_mariage='2026-10-01') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('MAJDOUB', 'SAMIA', '2026-10-01', '2025-07-21', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c40;
  ELSE
    SELECT id INTO v_c40 FROM clients WHERE nom_marie_1='MAJDOUB' AND prenom_marie_1='SAMIA' AND date_mariage='2026-10-01' LIMIT 1;
  END IF;

  -- Client 41: HAMOUDA (empty prenom)
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='HAMOUDA' AND prenom_marie_1='' AND date_mariage='2026-10-21') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('HAMOUDA', '', '2026-10-21', NULL, 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c41;
  ELSE
    SELECT id INTO v_c41 FROM clients WHERE nom_marie_1='HAMOUDA' AND prenom_marie_1='' AND date_mariage='2026-10-21' LIMIT 1;
  END IF;

  -- Client 42: GUESMI YOSRA
  SELECT EXISTS(SELECT 1 FROM clients WHERE nom_marie_1='GUESMI' AND prenom_marie_1='YOSRA' AND date_mariage='2026-10-22') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO clients (nom_marie_1, prenom_marie_1, date_mariage, date_inscription, statut, lieu_reception, archived, type_prestation)
    VALUES ('GUESMI', 'YOSRA', '2026-10-22', '2026-01-02', 'confirme', 'L''Élysée du Lac', false, '{}')
    RETURNING id INTO v_c42;
  ELSE
    SELECT id INTO v_c42 FROM clients WHERE nom_marie_1='GUESMI' AND prenom_marie_1='YOSRA' AND date_mariage='2026-10-22' LIMIT 1;
  END IF;

  -- ============================================================
  -- DEBITS (38 rows)
  -- All: designation='Location de la salle', categorie='location', quantite=1, taux_tva=19
  -- ============================================================

  -- Debit for Client 1: AYARI HAJER - 10000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c1, '2025-12-27', 1, 'Location de la salle', 10000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c1 AND designation = 'Location de la salle');

  -- Debit for Client 2: MCHIRI KARIM - 10000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c2, '2025-12-22', 1, 'Location de la salle', 10000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c2 AND designation = 'Location de la salle');

  -- Debit for Client 3: SALHI MEHREZ - 4500 DT (fallback date)
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c3, '2025-01-12', 1, 'Location de la salle', 4500, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c3 AND designation = 'Location de la salle');

  -- Debit for Client 4: YOUSSEF BEDAOUI - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c4, '2021-06-20', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c4 AND designation = 'Location de la salle');

  -- Debit for Client 5: KANOU HATEM - 10000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c5, '2025-12-22', 1, 'Location de la salle', 10000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c5 AND designation = 'Location de la salle');

  -- Debit for Client 6: BAZIZ MOENES - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c6, '2025-06-21', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c6 AND designation = 'Location de la salle');

  -- Debit for Client 7: TEMIM ABIR - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c7, '2025-08-17', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c7 AND designation = 'Location de la salle');

  -- Debit for Client 8: BAHRI MOOTAZ - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c8, '2025-04-26', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c8 AND designation = 'Location de la salle');

  -- Debit for Client 9: OURTANI MOHAMED - 6700 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c9, '2026-01-08', 1, 'Location de la salle', 6700, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c9 AND designation = 'Location de la salle');

  -- Debit for Client 10: CHIKHAOUI SARRA - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c10, '2025-10-31', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c10 AND designation = 'Location de la salle');

  -- Debit for Client 11: KILANI MONDHER - 8400 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c11, '2024-10-22', 1, 'Location de la salle', 8400, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c11 AND designation = 'Location de la salle');

  -- No debit for Client 12 (OPTION RIHAB)

  -- Debit for Client 13: TALBI MOUNIRA - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c13, '2025-08-25', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c13 AND designation = 'Location de la salle');

  -- Debit for Client 14: HAMAMI AYOUB - 10000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c14, '2025-12-27', 1, 'Location de la salle', 10000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c14 AND designation = 'Location de la salle');

  -- Debit for Client 15: BEN ZINA WALID - 9900 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c15, '2026-01-11', 1, 'Location de la salle', 9900, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c15 AND designation = 'Location de la salle');

  -- Debit for Client 16: REBAH NAJET - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c16, '2025-09-18', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c16 AND designation = 'Location de la salle');

  -- Debit for Client 17: ARFAOUI FAHMI - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c17, '2025-07-31', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c17 AND designation = 'Location de la salle');

  -- Debit for Client 18: DRIDI AMANI - 10000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c18, '2025-12-16', 1, 'Location de la salle', 10000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c18 AND designation = 'Location de la salle');

  -- Debit for Client 19: AYARI CHIRAZ - 12000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c19, '2025-07-24', 1, 'Location de la salle', 12000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c19 AND designation = 'Location de la salle');

  -- Debit for Client 20: EL MDINI AMAL - 9900 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c20, '2026-01-19', 1, 'Location de la salle', 9900, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c20 AND designation = 'Location de la salle');

  -- Debit for Client 21: CHALBI YACINE - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c21, '2025-09-13', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c21 AND designation = 'Location de la salle');

  -- Debit for Client 22: REZGUI FATIMA ZOHRA - 10000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c22, '2026-01-24', 1, 'Location de la salle', 10000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c22 AND designation = 'Location de la salle');

  -- Debit for Client 23: GHRAB AMAL - 10000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c23, '2026-01-24', 1, 'Location de la salle', 10000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c23 AND designation = 'Location de la salle');

  -- Debit for Client 24: ROMDHANE NAJLA - 10000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c24, '2025-09-12', 1, 'Location de la salle', 10000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c24 AND designation = 'Location de la salle');

  -- No debit for Client 25 (SAMI)
  -- No debit for Client 26 (ALI BEJAOUI)

  -- Debit for Client 27: ZAGHOUANI AHMED - 10000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c27, '2025-12-19', 1, 'Location de la salle', 10000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c27 AND designation = 'Location de la salle');

  -- Debit for Client 28: BOUAOUN YOUNES - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c28, '2025-10-30', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c28 AND designation = 'Location de la salle');

  -- Debit for Client 29: ALMI NADIA - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c29, '2025-09-23', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c29 AND designation = 'Location de la salle');

  -- Debit for Client 30: REZGUI AMIN ALLAH - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c30, '2025-08-21', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c30 AND designation = 'Location de la salle');

  -- Debit for Client 31: LACHHAB ZAHRA - 15000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c31, '2025-08-28', 1, 'Location de la salle', 15000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c31 AND designation = 'Location de la salle');

  -- Debit for Client 32: BEN SAID RAYEN - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c32, '2025-11-17', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c32 AND designation = 'Location de la salle');

  -- Debit for Client 33: AMAR FETEN - 9900 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c33, '2026-01-27', 1, 'Location de la salle', 9900, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c33 AND designation = 'Location de la salle');

  -- Debit for Client 34: MANKEBI YOSRA - 10000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c34, '2026-01-26', 1, 'Location de la salle', 10000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c34 AND designation = 'Location de la salle');

  -- Debit for Client 35: LABIDI SALOUA - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c35, '2025-08-27', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c35 AND designation = 'Location de la salle');

  -- Debit for Client 36: KHLIFI YOUSSEF - 15000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c36, '2024-10-05', 1, 'Location de la salle', 15000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c36 AND designation = 'Location de la salle');

  -- Debit for Client 37: MAROUANI HENI - 10000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c37, '2025-12-26', 1, 'Location de la salle', 10000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c37 AND designation = 'Location de la salle');

  -- Debit for Client 38: AKKAZ BAHRI - 14000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c38, '2025-11-08', 1, 'Location de la salle', 14000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c38 AND designation = 'Location de la salle');

  -- Debit for Client 39: KAROUI AYDA - 10500 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c39, '2025-12-20', 1, 'Location de la salle', 10500, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c39 AND designation = 'Location de la salle');

  -- Debit for Client 40: MAJDOUB SAMIA - 13000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c40, '2025-07-21', 1, 'Location de la salle', 13000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c40 AND designation = 'Location de la salle');

  -- No debit for Client 41 (HAMOUDA)

  -- Debit for Client 42: GUESMI YOSRA - 10000 DT
  INSERT INTO debits (client_id, date, quantite, designation, prix_unitaire_ht, taux_tva, categorie)
  SELECT v_c42, '2026-01-02', 1, 'Location de la salle', 10000, 19, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM debits WHERE client_id = v_c42 AND designation = 'Location de la salle');

  -- ============================================================
  -- REGLEMENTS (38 rows)
  -- ============================================================

  -- Reglement for Client 1: AYARI HAJER - 10000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c1, '2025-12-27', 'especes', 10000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c1 AND montant = 10000 AND mode = 'especes');

  -- Reglement for Client 2: MCHIRI KARIM - 10000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c2, '2025-12-22', 'especes', 10000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c2 AND montant = 10000 AND mode = 'especes');

  -- Reglement for Client 3: SALHI MEHREZ - 1000 DT especes (fallback date)
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c3, '2025-01-12', 'especes', 1000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c3 AND montant = 1000 AND mode = 'especes');

  -- Reglement for Client 4: YOUSSEF BEDAOUI - 2000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c4, '2021-06-20', 'especes', 2000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c4 AND montant = 2000 AND mode = 'especes');

  -- Reglement for Client 5: KANOU HATEM - 4500 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c5, '2025-12-22', 'especes', 4500
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c5 AND montant = 4500 AND mode = 'especes');

  -- Reglement for Client 6: BAZIZ MOENES - 4500 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c6, '2025-06-21', 'especes', 4500
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c6 AND montant = 4500 AND mode = 'especes');

  -- Reglement for Client 7: TEMIM ABIR - 3000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c7, '2025-08-17', 'especes', 3000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c7 AND montant = 3000 AND mode = 'especes');

  -- Reglement for Client 8: BAHRI MOOTAZ - 8000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c8, '2025-04-26', 'especes', 8000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c8 AND montant = 8000 AND mode = 'especes');

  -- Reglement for Client 9: OURTANI MOHAMED - 3000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c9, '2026-01-08', 'especes', 3000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c9 AND montant = 3000 AND mode = 'especes');

  -- Reglement for Client 10: CHIKHAOUI SARRA - 6500 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c10, '2025-10-31', 'especes', 6500
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c10 AND montant = 6500 AND mode = 'especes');

  -- Reglement for Client 12: OPTION RIHAB - 10000 DT virement
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c12, '2026-06-19', 'virement', 10000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c12 AND montant = 10000 AND mode = 'virement');

  -- Reglement for Client 13: TALBI MOUNIRA - 2000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c13, '2025-08-25', 'especes', 2000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c13 AND montant = 2000 AND mode = 'especes');

  -- Reglement for Client 14: HAMAMI AYOUB - 1500 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c14, '2025-12-27', 'especes', 1500
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c14 AND montant = 1500 AND mode = 'especes');

  -- Reglement for Client 15: BEN ZINA WALID - 4950 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c15, '2026-01-11', 'especes', 4950
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c15 AND montant = 4950 AND mode = 'especes');

  -- Reglement for Client 16: REBAH NAJET - 5000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c16, '2025-09-18', 'especes', 5000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c16 AND montant = 5000 AND mode = 'especes');

  -- Reglement for Client 17: ARFAOUI FAHMI - 3000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c17, '2025-07-31', 'especes', 3000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c17 AND montant = 3000 AND mode = 'especes');

  -- Reglement for Client 18: DRIDI AMANI - 4000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c18, '2025-12-16', 'especes', 4000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c18 AND montant = 4000 AND mode = 'especes');

  -- Reglement for Client 19: AYARI CHIRAZ - 2000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c19, '2025-07-24', 'especes', 2000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c19 AND montant = 2000 AND mode = 'especes');

  -- Reglement for Client 20: EL MDINI AMAL - 500 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c20, '2026-01-19', 'especes', 500
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c20 AND montant = 500 AND mode = 'especes');

  -- Reglement for Client 21: CHALBI YACINE - 6500 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c21, '2025-09-13', 'especes', 6500
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c21 AND montant = 6500 AND mode = 'especes');

  -- Reglement for Client 22: REZGUI FATIMA ZOHRA - 10000 DT virement
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c22, '2026-01-24', 'virement', 10000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c22 AND montant = 10000 AND mode = 'virement');

  -- Reglement for Client 23: GHRAB AMAL - 5000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c23, '2026-01-24', 'especes', 5000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c23 AND montant = 5000 AND mode = 'especes');

  -- Reglement for Client 24: ROMDHANE NAJLA - 5000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c24, '2025-09-12', 'especes', 5000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c24 AND montant = 5000 AND mode = 'especes');

  -- No reglement for Client 25 (SAMI)
  -- No reglement for Client 26 (ALI BEJAOUI)

  -- Reglement for Client 27: ZAGHOUANI AHMED - 2000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c27, '2025-12-19', 'especes', 2000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c27 AND montant = 2000 AND mode = 'especes');

  -- Reglement for Client 28: BOUAOUN YOUNES - 1500 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c28, '2025-10-30', 'especes', 1500
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c28 AND montant = 1500 AND mode = 'especes');

  -- Reglement for Client 29: ALMI NADIA - 1800 DT cheque
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c29, '2025-09-23', 'cheque', 1800
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c29 AND montant = 1800 AND mode = 'cheque');

  -- Reglement for Client 30: REZGUI AMIN ALLAH - 4000 DT cheque
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c30, '2025-08-21', 'cheque', 4000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c30 AND montant = 4000 AND mode = 'cheque');

  -- Reglement for Client 31: LACHHAB ZAHRA - 3320 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c31, '2025-08-28', 'especes', 3320
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c31 AND montant = 3320 AND mode = 'especes');

  -- Reglement for Client 32: BEN SAID RAYEN - 5000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c32, '2025-11-17', 'especes', 5000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c32 AND montant = 5000 AND mode = 'especes');

  -- Reglement for Client 33: AMAR FETEN - 2000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c33, '2026-01-27', 'especes', 2000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c33 AND montant = 2000 AND mode = 'especes');

  -- Reglement for Client 34: MANKEBI YOSRA - 2500 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c34, '2026-01-26', 'especes', 2500
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c34 AND montant = 2500 AND mode = 'especes');

  -- Reglement for Client 35: LABIDI SALOUA - 4000 DT virement
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c35, '2025-08-27', 'virement', 4000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c35 AND montant = 4000 AND mode = 'virement');

  -- Reglement for Client 36: KHLIFI YOUSSEF - 5000 DT cheque
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c36, '2024-10-05', 'cheque', 5000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c36 AND montant = 5000 AND mode = 'cheque');

  -- Reglement for Client 37: MAROUANI HENI - 3000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c37, '2025-12-26', 'especes', 3000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c37 AND montant = 3000 AND mode = 'especes');

  -- Reglement for Client 38: AKKAZ BAHRI - 2000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c38, '2025-11-08', 'especes', 2000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c38 AND montant = 2000 AND mode = 'especes');

  -- Reglement for Client 39: KAROUI AYDA - 4800 DT cheque
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c39, '2025-12-20', 'cheque', 4800
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c39 AND montant = 4800 AND mode = 'cheque');

  -- Reglement for Client 40: MAJDOUB SAMIA - 3000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c40, '2025-07-21', 'especes', 3000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c40 AND montant = 3000 AND mode = 'especes');

  -- No reglement for Client 41 (HAMOUDA)

  -- Reglement for Client 42: GUESMI YOSRA - 4000 DT especes
  INSERT INTO reglements (client_id, date, mode, montant)
  SELECT v_c42, '2026-01-02', 'especes', 4000
  WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE client_id = v_c42 AND montant = 4000 AND mode = 'especes');

  -- ============================================================
  -- CONTRATS (for clients with contract numbers)
  -- Clients without contrat: 12 (OPTION RIHAB), 25 (SAMI), 26 (ALI BEJAOUI), 41 (HAMOUDA)
  -- ============================================================

  -- Contrat for Client 1: AYARI HAJER - numero 116
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c1, 116, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c1 AND numero = 116);

  -- Contrat for Client 2: MCHIRI KARIM - numero 111
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c2, 111, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c2 AND numero = 111);

  -- Contrat for Client 3: SALHI MEHREZ - numero 120
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c3, 120, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c3 AND numero = 120);

  -- Contrat for Client 4: YOUSSEF BEDAOUI - numero 79
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c4, 79, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c4 AND numero = 79);

  -- Contrat for Client 5: KANOU HATEM - numero 112
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c5, 112, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c5 AND numero = 112);

  -- Contrat for Client 6: BAZIZ MOENES - numero 80
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c6, 80, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c6 AND numero = 80);

  -- Contrat for Client 7: TEMIM ABIR - numero 88
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c7, 88, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c7 AND numero = 88);

  -- Contrat for Client 8: BAHRI MOOTAZ - numero 76
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c8, 76, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c8 AND numero = 76);

  -- Contrat for Client 9: OURTANI MOHAMED - numero 118
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c9, 118, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c9 AND numero = 118);

  -- Contrat for Client 10: CHIKHAOUI SARRA - numero 105
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c10, 105, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c10 AND numero = 105);

  -- Contrat for Client 11: KILANI MONDHER - numero 51
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c11, 51, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c11 AND numero = 51);

  -- No contrat for Client 12 (OPTION RIHAB)

  -- Contrat for Client 13: TALBI MOUNIRA - numero 91
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c13, 91, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c13 AND numero = 91);

  -- Contrat for Client 14: HAMAMI AYOUB - numero 115
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c14, 115, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c14 AND numero = 115);

  -- Contrat for Client 15: BEN ZINA WALID - numero 119
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c15, 119, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c15 AND numero = 119);

  -- Contrat for Client 16: REBAH NAJET - numero 98
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c16, 98, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c16 AND numero = 98);

  -- Contrat for Client 17: ARFAOUI FAHMI - numero 85
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c17, 85, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c17 AND numero = 85);

  -- Contrat for Client 18: DRIDI AMANI - numero 108
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c18, 108, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c18 AND numero = 108);

  -- Contrat for Client 19: AYARI CHIRAZ - numero 84
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c19, 84, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c19 AND numero = 84);

  -- Contrat for Client 20: EL MDINI AMAL - numero 121
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c20, 121, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c20 AND numero = 121);

  -- Contrat for Client 21: CHALBI YACINE - numero 95
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c21, 95, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c21 AND numero = 95);

  -- Contrat for Client 22: REZGUI FATIMA ZOHRA - numero 123
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c22, 123, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c22 AND numero = 123);

  -- Contrat for Client 23: GHRAB AMAL - numero 122
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c23, 122, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c23 AND numero = 122);

  -- Contrat for Client 24: ROMDHANE NAJLA - numero 94
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c24, 94, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c24 AND numero = 94);

  -- No contrat for Client 25 (SAMI)
  -- No contrat for Client 26 (ALI BEJAOUI)

  -- Contrat for Client 27: ZAGHOUANI AHMED - numero 109
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c27, 109, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c27 AND numero = 109);

  -- Contrat for Client 28: BOUAOUN YOUNES - numero 104
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c28, 104, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c28 AND numero = 104);

  -- Contrat for Client 29: ALMI NADIA - numero 99
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c29, 99, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c29 AND numero = 99);

  -- Contrat for Client 30: REZGUI AMIN ALLAH - numero 89
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c30, 89, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c30 AND numero = 89);

  -- Contrat for Client 31: LACHHAB ZAHRA - numero 90
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c31, 90, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c31 AND numero = 90);

  -- Contrat for Client 32: BEN SAID RAYEN - numero 107
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c32, 107, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c32 AND numero = 107);

  -- Contrat for Client 33: AMAR FETEN - numero 125
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c33, 125, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c33 AND numero = 125);

  -- Contrat for Client 34: MANKEBI YOSRA - numero 124
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c34, 124, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c34 AND numero = 124);

  -- Contrat for Client 35: LABIDI SALOUA - numero 92
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c35, 92, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c35 AND numero = 92);

  -- Contrat for Client 36: KHLIFI YOUSSEF - numero 102
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c36, 102, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c36 AND numero = 102);

  -- Contrat for Client 37: MAROUANI HENI - numero 113
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c37, 113, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c37 AND numero = 113);

  -- Contrat for Client 38: AKKAZ BAHRI - numero 106
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c38, 106, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c38 AND numero = 106);

  -- Contrat for Client 39: KAROUI AYDA - numero 110
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c39, 110, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c39 AND numero = 110);

  -- Contrat for Client 40: MAJDOUB SAMIA - numero 83
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c40, 83, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c40 AND numero = 83);

  -- No contrat for Client 41 (HAMOUDA)

  -- Contrat for Client 42: GUESMI YOSRA - numero 117
  INSERT INTO contrats (client_id, numero, type)
  SELECT v_c42, 117, 'location'
  WHERE NOT EXISTS (SELECT 1 FROM contrats WHERE client_id = v_c42 AND numero = 117);

  RAISE NOTICE 'Import completed successfully!';
  RAISE NOTICE 'Imported: 42 clients, 38 debits, 38 reglements, 38 contrats';

END $$;
