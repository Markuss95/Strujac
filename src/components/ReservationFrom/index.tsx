// src/components/ReservationForm/index.tsx
import React, { useState } from "react";
import styled from "styled-components";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../contexts/AutContext";
import CustomDatePicker from "../DatePicker";
import TimeInput from "../TimeInput";
import "react-datepicker/dist/react-datepicker.css";

const FormContainer = styled.form`
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 20px auto;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: #0066cc;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #0052a3;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin-bottom: 10px;
  font-size: 0.875rem;
`;

const TimeContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
`;

const ReservationForm = () => {
  const { currentUser } = useAuth();
  const [odabraniDatum, setOdabraniDatum] = useState<Date | null>(null);
  const [vrijemePocetka, setVrijemePocetka] = useState("");
  const [vrijemeKraja, setVrijemeKraja] = useState("");
  const [opis, setOpis] = useState("");
  const [greska, setGreska] = useState<string | null>(null);
  const [ucitavanje, setUcitavanje] = useState(false);

  const provjeriKonflikte = async (datumPocetka: Date, datumKraja: Date) => {
    try {
      const rezervacijeRef = collection(db, "reservations");

      // Check for any overlapping reservations
      const q = query(
        rezervacijeRef,
        where("startTime", "<", datumKraja),
        where("endTime", ">", datumPocetka)
      );

      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error: any) {
      // If we get an index error, fall back to getting all reservations and checking manually
      if (error.code === "failed-precondition") {
        const rezervacijeRef = collection(db, "reservations");
        const snapshot = await getDocs(rezervacijeRef);

        return snapshot.docs.some((doc) => {
          const data = doc.data();
          const startTime = data.startTime.toDate();
          const endTime = data.endTime.toDate();

          return (
            (startTime < datumKraja && endTime > datumPocetka) ||
            (datumPocetka < endTime && datumKraja > startTime)
          );
        });
      }
      throw error;
    }
  };
  const formatUsername = (email: string): string => {
    const username = email.split("@")[0]; // Get the part before @
    const parts = username.split("."); // Split by dot
    if (parts.length >= 2) {
      // Capitalize first and second part
      const firstName =
        parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      const lastName =
        parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
      return `${firstName} ${lastName}`;
    }
    // If there's no dot, just capitalize the first letter
    return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!odabraniDatum) {
      setGreska("Molimo odaberite datum");
      return;
    }

    if (!vrijemePocetka || !vrijemeKraja) {
      setGreska("Molimo odaberite vrijeme početka i završetka");
      return;
    }

    setGreska(null);
    setUcitavanje(true);

    try {
      const datumPocetka = new Date(odabraniDatum);
      const datumKraja = new Date(odabraniDatum);

      const [satPocetka, minutePocetka] = vrijemePocetka.split(":").map(Number);
      const [satKraja, minuteKraja] = vrijemeKraja.split(":").map(Number);

      datumPocetka.setHours(satPocetka, minutePocetka, 0, 0);
      datumKraja.setHours(satKraja, minuteKraja, 0, 0);

      if (datumPocetka >= datumKraja) {
        throw new Error("Vrijeme završetka mora biti nakon vremena početka");
      }

      const imaKonflikta = await provjeriKonflikte(datumPocetka, datumKraja);
      if (imaKonflikta) {
        throw new Error("Ovaj termin je već rezerviran");
      }

      const rezervacijeRef = collection(db, "reservations");
      await addDoc(rezervacijeRef, {
        userId: currentUser?.uid,
        username: currentUser?.email
          ? formatUsername(currentUser.email.split("@")[0])
          : "Unknown User",
        startTime: datumPocetka,
        endTime: datumKraja,
        description: opis,
        createdAt: new Date(),
      });

      // Resetiranje forme
      setOdabraniDatum(null);
      setVrijemePocetka("");
      setVrijemeKraja("");
      setOpis("");
    } catch (err: any) {
      setGreska(err.message);
    } finally {
      setUcitavanje(false);
    }
  };
  const handleVrijemePocetkaChange = (vrijeme: string) => {
    setVrijemePocetka(vrijeme);
    // Ako je vrijeme završetka prazno ili manje od vremena početka,
    // postavi vrijeme završetka na sat nakon vremena početka
    if (!vrijemeKraja || vrijeme >= vrijemeKraja) {
      const [sati, minute] = vrijeme.split(":").map(Number);
      let noviSati = sati + 1;
      if (noviSati > 23) {
        noviSati = 23;
        setGreska("Rezervacija mora završiti isti dan");
      }
      setVrijemeKraja(
        `${noviSati.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`
      );
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <h2>Rezervirajte Automobil</h2>
      {greska && <ErrorMessage>{greska}</ErrorMessage>}

      <FormGroup>
        <Label>Datum</Label>
        <CustomDatePicker
          selectedDate={odabraniDatum}
          onChange={(date) => setOdabraniDatum(date)}
          placeholderText="Odaberite datum"
        />
      </FormGroup>

      <TimeContainer>
        <FormGroup>
          <Label>Vrijeme početka</Label>
          <TimeInput
            value={vrijemePocetka}
            onChange={handleVrijemePocetkaChange}
            required
            min="00:00"
            max="23:00"
          />
        </FormGroup>

        <FormGroup>
          <Label>Vrijeme završetka</Label>
          <TimeInput
            value={vrijemeKraja}
            onChange={setVrijemeKraja}
            required
            min={vrijemePocetka || "00:00"}
            max="23:59"
          />
        </FormGroup>
      </TimeContainer>

      <FormGroup>
        <Label>Opis</Label>
        <TextArea
          value={opis}
          onChange={(e) => setOpis(e.target.value)}
          placeholder="Unesite svrhu vaše rezervacije..."
        />
      </FormGroup>

      <Button type="submit" disabled={ucitavanje}>
        {ucitavanje ? "Stvaranje rezervacije..." : "Rezerviraj automobil"}
      </Button>
    </FormContainer>
  );
};

export default ReservationForm;
