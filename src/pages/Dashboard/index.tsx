// src/pages/Dashboard/index.tsx
import React, { useState } from "react";
import styled from "styled-components";
import { useAuth } from "../../contexts/AutContext";
import Calendar from "../../components/Calendar";
import ReservationForm from "../../components/ReservationFrom";
import Modal from "../../components/Modal";
import { Reservation } from "../../types";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebase";

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding: 1.5rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const WelcomeText = styled.span`
  font-size: 1rem;
  color: #34495e;
  font-weight: 500;
`;

const AdminButton = styled(Link)`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 102, 204, 0.2);
  }
`;

const LogoutButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.2);
  }
`;

const ResetPasswordButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(108, 117, 125, 0.2);
  }
`;

const MainContent = styled.main`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2.5rem;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const SectionCard = styled.section`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const SectionHeader = styled.div`
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e0e0e0;
`;

const SectionTitle = styled.h2`
  font-size: 1.4rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
`;

const CalendarSection = styled(SectionCard)`
  @media (max-width: 1100px) {
    order: 2;
  }
`;

const FormSection = styled(SectionCard)`
  @media (max-width: 1100px) {
    order: 1;
  }
`;

const Dashboard = () => {
  const { signOut, currentUser, userRole } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
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

  const handleResetPassword = async () => {
    if (!currentUser?.email) {
      alert("Korisnik nije prijavljen.");
      return;
    }

    try {
      // Set the language to Croatian
      auth.languageCode = "hr";

      // Configure the action URL (MUST be whitelisted in Firebase Console Authentication > Settings > Authorized domains)
      const actionCodeSettings = {
        url: "https://your-app-domain.com/login", // Replace with your actual app's URL
        handleCodeInApp: true,
      };

      await sendPasswordResetEmail(auth, currentUser.email, actionCodeSettings);
      alert("E-mail za resetiranje lozinke je poslan na vašu adresu.");
    } catch (error: any) {
      console.error("Greška prilikom slanja e-maila za resetiranje:", error);
      let errorMessage =
        "Došlo je do greške prilikom slanja e-maila za resetiranje lozinke.";

      // Translate Firebase error codes to Croatian
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Neispravna email adresa.";
          break;
        case "auth/user-not-found":
          errorMessage = "Korisnik s ovom email adresom nije pronađen.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Previše zahtjeva. Molimo pokušajte ponovno kasnije.";
          break;
        case "auth/unauthorized-continue-uri":
          errorMessage =
            "Domena nije ovlaštena u Firebase postavkama. Dodajte domenu u Firebase Console.";
          break;
        default:
          errorMessage =
            "Došlo je do nepoznate greške. Molimo pokušajte ponovno.";
      }
      alert(errorMessage);
    }
  };

  return (
    <DashboardContainer>
      <Header>
        <Title>Rezervacija Službenog Automobila</Title>
        <UserSection>
          <WelcomeText>Dobrodošli, {getDisplayName()}!</WelcomeText>
          {userRole === "admin" && (
            <AdminButton to="/users">Upravljanje Korisnicima</AdminButton>
          )}
          <ResetPasswordButton onClick={handleResetPassword}>
            Postavite lozinku
          </ResetPasswordButton>
          <LogoutButton onClick={signOut}>Odjava</LogoutButton>
        </UserSection>
      </Header>
      <MainContent>
        <CalendarSection>
          <SectionHeader>
            <SectionTitle>Kalendar Rezervacija</SectionTitle>
          </SectionHeader>
          <Calendar
            onEdit={handleEdit}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </CalendarSection>
        <FormSection>
          <SectionHeader>
            <SectionTitle>Nova Rezervacija</SectionTitle>
          </SectionHeader>
          <ReservationForm
            onSuccess={handleFormSuccess}
            selectedDate={selectedDate}
          />
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
