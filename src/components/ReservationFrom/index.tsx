// src/components/ReservationFrom/index.tsx
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  Timestamp,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../contexts/AutContext";
import { Reservation, ReservationFormData, User } from "../../types";
import CustomDatePicker from "../DatePicker";
import TimeInput from "../TimeInput";
import { formatUsername } from "../../utils/userUtils";

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: bold;
  color: #333;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Textarea = styled.textarea`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 12px;
  background-color: #1a75ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  margin-top: 10px;

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4d4d;
  font-size: 0.9rem;
`;

const SuccessMessage = styled.div`
  color: #4dff4d;
  font-size: 0.9rem;
`;

interface ReservationFormProps {
  existingReservation?: Reservation;
  onSuccess: () => void;
  selectedDate?: Date;
}

const ReservationForm: React.FC<ReservationFormProps> = ({
  existingReservation,
  onSuccess,
  selectedDate,
}) => {
  const { currentUser, userRole } = useAuth();
  const [startDate, setStartDate] = useState<Date | null>(
    existingReservation ? existingReservation.startTime : selectedDate || null
  );
  const [startTime, setStartTime] = useState(
    existingReservation
      ? existingReservation.startTime.toLocaleTimeString("hr-HR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : ""
  );
  const [endTime, setEndTime] = useState(
    existingReservation
      ? existingReservation.endTime.toLocaleTimeString("hr-HR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : ""
  );
  const [description, setDescription] = useState(
    existingReservation?.description || ""
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(currentUser?.uid || "");

  useEffect(() => {
    if (userRole === "admin" && !existingReservation) {
      const q = query(collection(db, "users"), where("disabled", "==", false));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const userList: User[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as User)
        );

        // Fetch current user data to ensure they are included
        if (currentUser) {
          const currentUserRef = doc(db, "users", currentUser.uid);
          const currentUserSnap = await getDoc(currentUserRef);
          if (currentUserSnap.exists()) {
            const currentUserData = currentUserSnap.data() as User;
            const currentUserFormatted: User = {
              id: currentUser.uid,
              username:
                currentUserData.username ||
                formatUsername(currentUser.email || ""),
              email: currentUser.email || "",
              role: currentUserData.role || "regular",
              disabled: currentUserData.disabled || false,
            };

            // Combine current user with other active users, avoiding duplicates
            const updatedUserList = [
              currentUserFormatted,
              ...userList.filter((user) => user.id !== currentUser.uid),
            ];
            setUsers(updatedUserList);
          } else {
            setUsers(userList);
          }
        } else {
          setUsers(userList);
        }
      });
      return unsubscribe;
    }
  }, [userRole, existingReservation, currentUser]);

  const parseDateTime = (date: Date | null, time: string): Date | null => {
    if (!date || !time) return null;
    const [hours, minutes] = time.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  const checkOverlapping = async (
    start: Date,
    end: Date,
    excludeId?: string
  ) => {
    const q = query(collection(db, "reservations"));
    const snapshot = await getDocs(q);
    return snapshot.docs.some((doc) => {
      if (excludeId && doc.id === excludeId) return false;
      const data = doc.data();
      const existingStart = data.startTime.toDate();
      const existingEnd = data.endTime.toDate();
      return start < existingEnd && end > existingStart;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const start = parseDateTime(startDate, startTime);
    const end = parseDateTime(startDate, endTime);

    if (!start || !end) {
      setError("Molimo odaberite datum i vrijeme.");
      return;
    }

    if (start >= end) {
      setError("Vrijeme početka mora biti prije vremena završetka.");
      return;
    }

    setLoading(true);

    try {
      const overlapping = await checkOverlapping(
        start,
        end,
        existingReservation?.id
      );
      if (overlapping) {
        setError("Ovaj termin je već rezerviran.");
        return;
      }

      let finalUserId = currentUser?.uid || "";
      let finalUsername = currentUser?.email
        ? formatUsername(currentUser.email)
        : "";

      if (userRole === "admin" && !existingReservation) {
        const selectedUser = users.find((u) => u.id === selectedUserId);
        if (selectedUser) {
          finalUserId = selectedUser.id;
          finalUsername = selectedUser.username;
        }
      } else if (existingReservation) {
        finalUserId = existingReservation.userId;
        finalUsername = existingReservation.username;
      }

      if (existingReservation) {
        await updateDoc(doc(db, "reservations", existingReservation.id), {
          startTime: Timestamp.fromDate(start),
          endTime: Timestamp.fromDate(end),
          description,
        });
      } else {
        await addDoc(collection(db, "reservations"), {
          userId: finalUserId,
          username: finalUsername,
          startTime: Timestamp.fromDate(start),
          endTime: Timestamp.fromDate(end),
          description,
          createdAt: Timestamp.now(),
        });
      }

      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError("Došlo je do greške prilikom spremanja rezervacije.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper onSubmit={handleSubmit}>
      <FormGroup>
        <Label>Datum</Label>
        <CustomDatePicker
          selectedDate={startDate}
          onChange={setStartDate}
          minDate={new Date()}
        />
      </FormGroup>

      {userRole === "admin" && !existingReservation && users.length > 0 && (
        <FormGroup>
          <Label>Rezervacija za korisnika</Label>
          <Select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </Select>
        </FormGroup>
      )}

      <FormGroup>
        <Label>Vrijeme početka</Label>
        <TimeInput value={startTime} onChange={setStartTime} />
      </FormGroup>

      <FormGroup>
        <Label>Vrijeme završetka</Label>
        <TimeInput value={endTime} onChange={setEndTime} />
      </FormGroup>

      <FormGroup>
        <Label>Opis (opcionalno)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Unesite opis rezervacije..."
        />
      </FormGroup>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && (
        <SuccessMessage>Rezervacija uspješno spremljena!</SuccessMessage>
      )}

      <Button type="submit" disabled={loading}>
        {loading
          ? "Spremanje..."
          : existingReservation
          ? "Ažuriraj rezervaciju"
          : "Rezerviraj"}
      </Button>
    </FormWrapper>
  );
};

export default ReservationForm;
