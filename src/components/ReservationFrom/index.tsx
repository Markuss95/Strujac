// src/components/ReservationForm/index.tsx
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../contexts/AutContext";
import CustomDatePicker from "../DatePicker";
import TimeInput from "../TimeInput";
import { Reservation } from "../../types";
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

interface ReservationFormProps {
  existingReservation?: Reservation | null;
  onSuccess?: () => void;
}

const ReservationForm: React.FC<ReservationFormProps> = ({
  existingReservation,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [odabraniDatum, setOdabraniDatum] = useState<Date | null>(null);
  const [vrijemePocetka, setVrijemePocetka] = useState("");
  const [vrijemeKraja, setVrijemeKraja] = useState("");
  const [opis, setOpis] = useState("");
  const [greska, setGreska] = useState<string | null>(null);
  const [ucitavanje, setUcitavanje] = useState(false);

  useEffect(() => {
    if (existingReservation) {
      setOdabraniDatum(existingReservation.startTime);
      setVrijemePocetka(formatTime(existingReservation.startTime));
      setVrijemeKraja(formatTime(existingReservation.endTime));
      setOpis(existingReservation.description || "");
    } else {
      // Reset for create mode
      setOdabraniDatum(null);
      setVrijemePocetka("");
      setVrijemeKraja("");
      setOpis("");
    }
  }, [existingReservation]);

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const provjeriKonflikte = async (
    datumPocetka: Date,
    datumKraja: Date,
    excludeId?: string
  ) => {
    try {
      const rezervacijeRef = collection(db, "reservations");
      const q = query(
        rezervacijeRef,
        where("startTime", "<", datumKraja),
        where("endTime", ">", datumPocetka)
      );

      const snapshot = await getDocs(q);
      const overlapping = snapshot.docs.filter((d) => d.id !== excludeId);
      return overlapping.length > 0;
    } catch (error: any) {
      if (error.code === "failed-precondition") {
        const rezervacijeRef = collection(db, "reservations");
        const snapshot = await getDocs(rezervacijeRef);

        return snapshot.docs.some((d) => {
          if (d.id === excludeId) return false;
          const data = d.data();
          // Skip invalid documents missing required timestamp fields
          if (!data.startTime || !data.endTime) {
            console.warn(
              `Skipping invalid reservation document in conflict check: ${d.id} (missing timestamp fields)`
            );
            return false;
          }
          const startTime = data.startTime.toDate();
          const endTime = data.endTime.toDate();

          return startTime < datumKraja && endTime > datumPocetka;
        });
      }
      throw error;
    }
  };

  const formatUsername = (email: string): string => {
    const username = email.split("@")[0];
    const parts = username.split(".");
    if (parts.length >= 2) {
      const firstName =
        parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      const lastName =
        parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
      return `${firstName} ${lastName}`;
    }
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

      const imaKonflikta = await provjeriKonflikte(
        datumPocetka,
        datumKraja,
        existingReservation?.id
      );
      if (imaKonflikta) {
        throw new Error("Ovaj termin je već rezerviran");
      }

      if (existingReservation) {
        // Update existing reservation
        const resDoc = doc(db, "reservations", existingReservation.id);
        await updateDoc(resDoc, {
          startTime: datumPocetka,
          endTime: datumKraja,
          description: opis,
        });
      } else {
        // Create new reservation
        const rezervacijeRef = collection(db, "reservations");
        await addDoc(rezervacijeRef, {
          userId: currentUser?.uid,
          username: currentUser?.email
            ? formatUsername(currentUser.email)
            : "Unknown User",
          startTime: datumPocetka,
          endTime: datumKraja,
          description: opis,
          createdAt: new Date(),
        });
      }

      // Reset form and call onSuccess
      setOdabraniDatum(null);
      setVrijemePocetka("");
      setVrijemeKraja("");
      setOpis("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setGreska(err.message);
    } finally {
      setUcitavanje(false);
    }
  };

  const handleVrijemePocetkaChange = (vrijeme: string) => {
    setVrijemePocetka(vrijeme);
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
      <h2>
        {existingReservation
          ? "Ažuriraj Rezervaciju"
          : "Rezervirajte Automobil"}
      </h2>
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
        {ucitavanje
          ? "Spremanje..."
          : existingReservation
          ? "Ažuriraj rezervaciju"
          : "Rezerviraj automobil"}
      </Button>
    </FormContainer>
  );
};

export default ReservationForm;
