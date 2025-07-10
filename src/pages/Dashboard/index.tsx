// Updated src/pages/Dashboard/index.tsx
import React, { useState } from "react";
import styled from "styled-components";
import { useAuth } from "../../contexts/AutContext";
import Calendar from "../../components/Calendar";
import ReservationForm from "../../components/ReservationFrom";
import Modal from "../../components/Modal"; // New import
import { Reservation } from "../../types";

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: 100vh;
  background-color: #f8f9fa;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  color: #2c3e50;
  margin: 0;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const WelcomeText = styled.span`
  font-size: 1rem;
  color: #34495e;
`;

const LogoutButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #c0392b;
  }
`;

const MainContent = styled.main`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const CalendarSection = styled.section`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const FormSection = styled.section`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  @media (max-width: 900px) {
    order: -1;
  }
`;

const Dashboard = () => {
  const { signOut, currentUser } = useAuth();
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const getDisplayName = () => {
    if (!currentUser?.email) return "";
    const username = currentUser.email.split("@")[0];
    return username
      .split(".")
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleEdit = (reservation: Reservation) => {
    const now = new Date();
    if (reservation.startTime < now) {
      alert("Ne možete uređivati prošle rezervacije.");
      return;
    }
    setEditingReservation(reservation);
    setShowEditModal(true);
  };

  const handleFormSuccess = () => {
    setShowEditModal(false);
    setEditingReservation(null);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingReservation(null);
  };

  return (
    <DashboardContainer>
      <Header>
        <Title>Rezervacija Službenog Automobila</Title>
        <UserSection>
          <WelcomeText>Dobrodošli, {getDisplayName()}!</WelcomeText>
          <LogoutButton onClick={signOut}>Odjava</LogoutButton>
        </UserSection>
      </Header>
      <MainContent>
        <CalendarSection>
          <Calendar onEdit={handleEdit} />
        </CalendarSection>
        <FormSection>
          <ReservationForm onSuccess={handleFormSuccess} />
        </FormSection>
      </MainContent>
      {showEditModal && editingReservation && (
        <Modal onClose={handleCloseModal}>
          <ReservationForm
            existingReservation={editingReservation}
            onSuccess={handleFormSuccess}
          />
        </Modal>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;
