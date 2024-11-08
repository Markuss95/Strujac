import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Reservation } from "../../types";
import { formatDate, formatTime } from "../../utils/dateUtils";

const CalendarWrapper = styled.div`
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const DateNavigator = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NavButton = styled.button`
  padding: 5px 10px;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #0052a3;
  }
`;

const CurrentDate = styled.h3`
  margin: 0;
  min-width: 150px;
  text-align: center;
`;

const DayColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TimeSlot = styled.div<{ isReserved: boolean }>`
  padding: 10px;
  margin: 2px;
  background-color: ${(props) => (props.isReserved ? "#ffebee" : "#f5f5f5")};
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) => (props.isReserved ? "#ffcdd2" : "#e0e0e0")};
  }
`;

const ReservationInfo = styled.div`
  font-size: 0.875rem;
  color: #666;
  margin-top: 4px;
`;

const Calendar = () => {
  const [rezervacije, setRezervacije] = useState<Reservation[]>([]);
  const [odabraniDatum, setOdabraniDatum] = useState(new Date());

  useEffect(() => {
    const rezervacijeRef = collection(db, "reservations");
    const q = query(rezervacijeRef, orderBy("startTime"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noveRezervacije: Reservation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        noveRezervacije.push({
          ...data,
          id: doc.id,
          startTime: data.startTime.toDate(),
          endTime: data.endTime.toDate(),
          createdAt: data.createdAt.toDate(),
        } as Reservation);
      });
      setRezervacije(noveRezervacije);
    });

    return () => unsubscribe();
  }, []);

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
  const dohvatiRezervacijuZaVremenskiTermin = (datum: Date, sat: number) => {
    return rezervacije.find((rezervacija) => {
      const pocetakTermina = new Date(datum);
      pocetakTermina.setHours(sat, 0, 0, 0);
      const krajTermina = new Date(datum);
      krajTermina.setHours(sat + 1, 0, 0, 0);

      return (
        rezervacija.startTime < krajTermina &&
        rezervacija.endTime > pocetakTermina
      );
    });
  };

  const formatirajVrijeme = (sat: number): string => {
    return `${sat.toString().padStart(2, "0")}:00`;
  };

  const prikaziVremenskeTermine = () => {
    const termini = [];
    for (let sat = 0; sat < 24; sat++) {
      const rezervacija = dohvatiRezervacijuZaVremenskiTermin(
        odabraniDatum,
        sat
      );
      termini.push(
        <TimeSlot key={sat} isReserved={!!rezervacija}>
          {formatirajVrijeme(sat)}
          {rezervacija && (
            <ReservationInfo>
              {formatUsername(rezervacija.username)}
              {rezervacija.description && (
                <>
                  <br />
                  {rezervacija.description}
                </>
              )}
            </ReservationInfo>
          )}
        </TimeSlot>
      );
    }
    return termini;
  };

  const promijeniDatum = (brojDana: number) => {
    const noviDatum = new Date(odabraniDatum);
    noviDatum.setDate(noviDatum.getDate() + brojDana);
    setOdabraniDatum(noviDatum);
  };

  const getDanUTjednu = (datum: Date): string => {
    const dani = [
      "Nedjelja",
      "Ponedjeljak",
      "Utorak",
      "Srijeda",
      "Četvrtak",
      "Petak",
      "Subota",
    ];
    return dani[datum.getDay()];
  };

  return (
    <CalendarWrapper>
      <CalendarHeader>
        <h2>Kalendar Dostupnosti Automobila</h2>
        <DateNavigator>
          <NavButton onClick={() => promijeniDatum(-1)}>
            Prethodni Dan
          </NavButton>
          <CurrentDate>
            {getDanUTjednu(odabraniDatum)}
            <br />
            {formatDate(odabraniDatum)}
          </CurrentDate>
          <NavButton onClick={() => promijeniDatum(1)}>Sljedeći Dan</NavButton>
        </DateNavigator>
      </CalendarHeader>
      <DayColumn>{prikaziVremenskeTermine()}</DayColumn>
    </CalendarWrapper>
  );
};

export default Calendar;
