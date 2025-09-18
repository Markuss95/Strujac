// src/components/BatteryBar/index.tsx
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Timestamp,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../contexts/AutContext";

const BatteryContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
`;

const BatteryLabel = styled.span`
  font-weight: 600;
  color: #2c3e50;
  font-size: 1rem;
  min-width: 120px;
`;

const BatteryBarContainer = styled.div`
  flex: 1;
  height: 24px;
  background-color: #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #dee2e6;
  position: relative;
`;

const BatteryFill = styled.div<{ level: number }>`
  height: 100%;
  width: ${(props) => props.level}%;
  background: ${(props) => {
    if (props.level > 60)
      return "linear-gradient(90deg, #27ae60 0%, #2ecc71 100%)";
    if (props.level > 30)
      return "linear-gradient(90deg, #f39c12 0%, #e67e22 100%)";
    return "linear-gradient(90deg, #e74c3c 0%, #c0392b 100%)";
  }};
  transition: width 0.3s ease, background 0.3s ease;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
    );
    animation: shine 2s infinite;
  }

  @keyframes shine {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

const BatteryPercentage = styled.span<{ level: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 700;
  font-size: 0.85rem;
  color: ${(props) => (props.level > 50 ? "#2c3e50" : "#2c3e50")};
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  z-index: 1;
`;

const BatteryIcon = styled.div<{ level: number }>`
  width: 32px;
  height: 20px;
  border: 2px solid #2c3e50;
  border-radius: 2px;
  position: relative;
  background: white;

  &::before {
    content: "";
    position: absolute;
    top: 4px;
    right: -6px;
    width: 4px;
    height: 8px;
    background: #2c3e50;
    border-radius: 0 2px 2px 0;
  }

  &::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    height: ${(props) => (props.level / 100) * 12}px;
    background: ${(props) => {
      if (props.level > 60) return "#27ae60";
      if (props.level > 30) return "#f39c12";
      return "#e74c3c";
    }};
    border-radius: 1px;
    transition: all 0.3s ease;
    bottom: 2px;
    top: auto;
  }
`;

const EditButton = styled.button`
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }
`;

const EditForm = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BatteryInput = styled.input`
  width: 80px;
  padding: 0.5rem;
  border: 2px solid #3498db;
  border-radius: 4px;
  font-size: 1rem;
  text-align: center;
  font-weight: 600;

  &:focus {
    outline: none;
    border-color: #2980b9;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const SaveButton = styled.button`
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
  }

  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const CancelButton = styled.button`
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(149, 165, 166, 0.3);
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 0.85rem;
  margin-left: 0.5rem;
`;

const LastUpdated = styled.div`
  font-size: 0.75rem;
  color: #7f8c8d;
  text-align: center;
  margin-top: 0.5rem;
`;

interface BatteryData {
  level: number;
  lastUpdated: Timestamp | Date;
  updatedBy: string;
}

const BatteryBar: React.FC = () => {
  const { userRole, currentUser } = useAuth();
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>("100");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updatedBy, setUpdatedBy] = useState<string>("");
  const [updatedByUsername, setUpdatedByUsername] = useState<string>("");

  useEffect(() => {
    // Listen for real-time updates to battery level
    const batteryRef = doc(db, "settings", "battery");
    const unsubscribe = onSnapshot(batteryRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as BatteryData;
        setBatteryLevel(data.level);

        // Handle both Firestore Timestamp and Date objects
        if (data.lastUpdated) {
          const dateValue =
            data.lastUpdated instanceof Timestamp
              ? data.lastUpdated.toDate()
              : data.lastUpdated;
          setLastUpdated(dateValue);
        }

        setUpdatedBy(data.updatedBy || "");

        // Get username from users collection based on email
        if (data.updatedBy && data.updatedBy !== "System") {
          try {
            const usersQuery = query(
              collection(db, "users"),
              where("email", "==", data.updatedBy)
            );
            const userSnapshot = await getDocs(usersQuery);

            if (!userSnapshot.empty) {
              const userData = userSnapshot.docs[0].data();
              setUpdatedByUsername(userData.username || data.updatedBy);
            } else {
              setUpdatedByUsername(data.updatedBy);
            }
          } catch (error) {
            console.error("Error fetching username:", error);
            setUpdatedByUsername(data.updatedBy);
          }
        } else {
          setUpdatedByUsername(data.updatedBy || "");
        }
      } else {
        // Initialize with default values if document doesn't exist
        initializeBattery();
      }
    });

    return unsubscribe;
  }, []);

  const initializeBattery = async () => {
    try {
      const batteryRef = doc(db, "settings", "battery");
      const initialData = {
        level: 100,
        lastUpdated: Timestamp.now(),
        updatedBy: "System",
      };
      await setDoc(batteryRef, initialData);
    } catch (error) {
      console.error("Error initializing battery:", error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(batteryLevel.toString());
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(batteryLevel.toString());
    setError(null);
  };

  const handleSave = async () => {
    const newLevel = parseInt(editValue);

    if (isNaN(newLevel) || newLevel < 0 || newLevel > 100) {
      setError("Razina baterije mora biti između 0 i 100%");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const batteryRef = doc(db, "settings", "battery");
      const updateData = {
        level: newLevel,
        lastUpdated: Timestamp.now(),
        updatedBy: currentUser?.email || "Nepoznato",
      };

      await setDoc(batteryRef, updateData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating battery:", error);
      setError("Greška prilikom ažuriranja razine baterije");
    } finally {
      setLoading(false);
    }
  };

  const formatLastUpdated = (date: Date | null, username: string): string => {
    if (!date) return "";

    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    let timeAgo = "";
    if (diffInMinutes < 1) timeAgo = "upravo";
    else if (diffInMinutes < 60) timeAgo = `prije ${diffInMinutes} min`;
    else if (diffInMinutes < 1440)
      timeAgo = `prije ${Math.floor(diffInMinutes / 60)} h`;
    else
      timeAgo = `${date.toLocaleDateString(
        "hr-HR"
      )} u ${date.toLocaleTimeString("hr-HR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

    const displayName = username || "Nepoznato";
    return `Nivo baterije ažurirao ${displayName} ${timeAgo}`;
  };

  return (
    <div>
      <BatteryContainer>
        <BatteryIcon level={batteryLevel} />
        <BatteryLabel>Razina baterije vozila:</BatteryLabel>

        <BatteryBarContainer>
          <BatteryFill level={batteryLevel} />
          <BatteryPercentage level={batteryLevel}>
            {batteryLevel}%
          </BatteryPercentage>
        </BatteryBarContainer>

        {userRole === "admin" && !isEditing && (
          <EditButton onClick={handleEdit}>Uredi</EditButton>
        )}

        {userRole === "admin" && isEditing && (
          <EditForm>
            <BatteryInput
              type="number"
              min="0"
              max="100"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="0-100"
            />
            <span>%</span>
            <SaveButton onClick={handleSave} disabled={loading}>
              {loading ? "..." : "Spremi"}
            </SaveButton>
            <CancelButton onClick={handleCancel}>Odustani</CancelButton>
          </EditForm>
        )}
      </BatteryContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {lastUpdated && (
        <LastUpdated>
          {formatLastUpdated(lastUpdated, updatedByUsername)}
        </LastUpdated>
      )}
    </div>
  );
};

export default BatteryBar;
