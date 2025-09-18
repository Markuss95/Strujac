// src/components/Calendar/index.tsx
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { Reservation } from "../../types";
import { useAuth } from "../../contexts/AutContext";

const CalendarWrapper = styled.div`
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const MonthViewWrapper = styled.div`
  margin-bottom: 20px;
`;

const MonthHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
`;

const MonthTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #333;
`;

const MonthNavButton = styled.button`
  padding: 8px 16px;
  background-color: #1a75ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
`;

const WeekDays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: bold;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
`;

const WeekDay = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

interface DayProps {
  isCurrentMonth: boolean;
  isToday: boolean;
  hasReservations: boolean;
  isSelected: boolean;
}

const Day = styled.div<DayProps>`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  position: relative;
  font-weight: ${(props) => (props.isToday ? "bold" : "normal")};

  background-color: ${(props) => {
    if (!props.isCurrentMonth) return "#f0f0f0";
    if (props.isSelected) return "#1a75ff";
    if (props.hasReservations) return "#ff4d4d";
    if (props.isToday) return "#4dff4d";
    return "white";
  }};

  color: ${(props) => {
    if (!props.isCurrentMonth) return "#999";
    if (props.isSelected || props.hasReservations) return "white";
    return "#333";
  }};

  border: ${(props) => {
    if (props.isToday) return "2px solid #1a75ff";
    if (props.isSelected) return "2px solid #1a75ff";
    return "1px solid #eee";
  }};
`;

const Legend = styled.div`
  display: flex;
  gap: 20px;
  padding: 10px;
  margin: 15px 0;
  justify-content: center;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
`;

const LegendColor = styled.div<{ color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background-color: ${(props) => props.color};
  border: 1px solid #ddd;
`;

const DailyViewWrapper = styled.div`
  margin-top: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  max-height: 600px;
  overflow-y: auto;
`;

const DailyViewHeader = styled.div`
  position: sticky;
  top: 0;
  background: white;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  z-index: 1;
`;

const DailyViewTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
`;

const TimeSlotGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  padding-top: 25px;
`;

interface TimeSlotProps {
  isReserved: boolean;
}

const TimeSlot = styled.div<TimeSlotProps>`
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  border-radius: 6px;
  background-color: ${(props) => (props.isReserved ? "#e74c3c" : "#f6f8fa")};
  color: ${(props) => (props.isReserved ? "white" : "#34495e")};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const TimeSlotHeader = styled.div`
  font-weight: 600;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: "";
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: currentColor;
    opacity: 0.3;
  }
`;

const ReservationInfo = styled.div`
  padding: 8px 12px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.15);
  font-size: 0.9rem;

  > div {
    margin: 4px 0;
    display: flex;
    gap: 6px;

    strong {
      font-weight: 600;
    }
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  background-color: ${(props) => (props.danger ? "#dc3545" : "#007bff")};
  color: white;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) => (props.danger ? "#c82333" : "#0062cc")};
  }
`;

const NoReservationsMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
`;

interface CalendarProps {
  onEdit: (reservation: Reservation) => void;
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
}

const Calendar: React.FC<CalendarProps> = ({
  onEdit,
  selectedDate,
  setSelectedDate,
}) => {
  const [rezervacije, setRezervacije] = useState<Reservation[]>([]);
  const [trenutniMjesec, setTrenutniMjesec] = useState(new Date());
  const { currentUser, userRole } = useAuth();

  useEffect(() => {
    const rezervacijeRef = collection(db, "reservations");
    const q = query(rezervacijeRef, orderBy("startTime"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noveRezervacije: Reservation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.startTime || !data.endTime || !data.createdAt) {
          console.warn(
            `Skipping invalid reservation document: ${doc.id} (missing timestamp fields)`
          );
          return;
        }
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

  const formatVrijemeFull = (date: Date): string => {
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const getMonthData = () => {
    const year = trenutniMjesec.getFullYear();
    const month = trenutniMjesec.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const daysInPreviousMonth = new Date(year, month, 0).getDate();
    const previousMonthDays = Array.from({ length: startingDay }, (_, i) => ({
      date: new Date(
        year,
        month - 1,
        daysInPreviousMonth - startingDay + i + 1
      ),
      isCurrentMonth: false,
    }));

    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
      date: new Date(year, month, i + 1),
      isCurrentMonth: true,
    }));

    const remainingDays =
      42 - (previousMonthDays.length + currentMonthDays.length);
    const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => ({
      date: new Date(year, month + 1, i + 1),
      isCurrentMonth: false,
    }));

    return [...previousMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  const provjeriRezervacijeZaDan = (datum: Date): boolean => {
    const pocetak = new Date(datum);
    pocetak.setHours(0, 0, 0, 0);
    const kraj = new Date(datum);
    kraj.setHours(23, 59, 59, 999);

    return rezervacije.some(
      (rezervacija) =>
        (rezervacija.startTime >= pocetak && rezervacija.startTime <= kraj) ||
        (rezervacija.endTime >= pocetak && rezervacija.endTime <= kraj) ||
        (rezervacija.startTime <= pocetak && rezervacija.endTime >= kraj)
    );
  };

  const mjeseci = [
    "Siječanj",
    "Veljača",
    "Ožujak",
    "Travanj",
    "Svibanj",
    "Lipanj",
    "Srpanj",
    "Kolovoz",
    "Rujan",
    "Listopad",
    "Studeni",
    "Prosinac",
  ];

  const daniUTjednu = ["Ned", "Pon", "Uto", "Sri", "Čet", "Pet", "Sub"];

  const promijeniMjesec = (offset: number) => {
    setTrenutniMjesec(
      new Date(
        trenutniMjesec.getFullYear(),
        trenutniMjesec.getMonth() + offset,
        1
      )
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm("Jeste li sigurni da želite obrisati ovu rezervaciju?")
    ) {
      try {
        await deleteDoc(doc(db, "reservations", id));
      } catch (err) {
        console.error("Greška prilikom brisanja:", err);
      }
    }
  };

  const prikaziVremenskeTermine = () => {
    const dailyReservations = rezervacije
      .filter((rez) => {
        return rez.startTime.toDateString() === selectedDate.toDateString();
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    if (dailyReservations.length === 0) {
      return (
        <NoReservationsMessage>
          Nema rezervacija za ovaj dan.
        </NoReservationsMessage>
      );
    }

    return dailyReservations.map((rezervacija) => {
      const slotHeader = `${formatVrijemeFull(
        rezervacija.startTime
      )} - ${formatVrijemeFull(rezervacija.endTime)}`;

      return (
        <TimeSlot key={rezervacija.id} isReserved={true}>
          <TimeSlotHeader>{slotHeader}</TimeSlotHeader>
          <ReservationInfo>
            <div>
              <strong>Korisnik:</strong> {formatUsername(rezervacija.username)}
            </div>
            {rezervacija.description && (
              <div>
                <strong>Opis:</strong> {rezervacija.description}
              </div>
            )}
          </ReservationInfo>
          {(rezervacija.userId === currentUser?.uid ||
            userRole === "admin") && (
            <Actions>
              <ActionButton onClick={() => onEdit(rezervacija)}>
                Uredi
              </ActionButton>
              <ActionButton danger onClick={() => handleDelete(rezervacija.id)}>
                Obriši
              </ActionButton>
            </Actions>
          )}
        </TimeSlot>
      );
    });
  };

  const formatirajDatum = (datum: Date): string => {
    const dan = datum.getDate().toString().padStart(2, "0");
    const mjesec = (datum.getMonth() + 1).toString().padStart(2, "0");
    const godina = datum.getFullYear();
    return `${dan}.${mjesec}.${godina}`;
  };

  const CalendarLegend = () => (
    <Legend>
      <LegendItem>
        <LegendColor color="#ff4d4d" />
        <span>Postoji rezervacija u tom danu</span>
      </LegendItem>
      <LegendItem>
        <LegendColor color="#f0f0f0" />
        <span>Bez rezervacija</span>
      </LegendItem>
    </Legend>
  );

  return (
    <CalendarWrapper>
      <MonthViewWrapper>
        <MonthHeader>
          <MonthNavButton onClick={() => promijeniMjesec(-1)}>
            ← Prethodni
          </MonthNavButton>
          <MonthTitle>
            {mjeseci[trenutniMjesec.getMonth()]} {trenutniMjesec.getFullYear()}
          </MonthTitle>
          <MonthNavButton onClick={() => promijeniMjesec(1)}>
            Sljedeći →
          </MonthNavButton>
        </MonthHeader>

        <WeekDays>
          {daniUTjednu.map((dan) => (
            <WeekDay key={dan}>{dan}</WeekDay>
          ))}
        </WeekDays>

        <MonthGrid>
          {getMonthData().map(({ date, isCurrentMonth }, index) => (
            <Day
              key={index}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday(date)}
              hasReservations={provjeriRezervacijeZaDan(date)}
              isSelected={isSelected(date)}
              onClick={() => setSelectedDate(date)}
            >
              {date.getDate()}
            </Day>
          ))}
        </MonthGrid>

        <CalendarLegend />
      </MonthViewWrapper>

      <DailyViewWrapper>
        <DailyViewHeader>
          <DailyViewTitle>
            Raspored za {formatirajDatum(selectedDate)}
          </DailyViewTitle>
        </DailyViewHeader>
        <TimeSlotGrid>{prikaziVremenskeTermine()}</TimeSlotGrid>
      </DailyViewWrapper>
    </CalendarWrapper>
  );
};

export default Calendar;
