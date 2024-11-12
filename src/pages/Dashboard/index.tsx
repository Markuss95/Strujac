import React from "react";
import styled from "styled-components";
import { useAuth } from "../../contexts/AutContext";
import Calendar from "../../components/Calendar";
import ReservationForm from "../../components/ReservationFrom";

const DashboardContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const LogoutButton = styled.button`
  padding: 8px 16px;
  margin-left: 2rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #c82333;
  }
`;

const Dashboard = () => {
  const { signOut, currentUser } = useAuth();

  return (
    <DashboardContainer>
      <Header>
        <h1>Aplikacija Za Rezervaciju Automobila</h1>
        <div>
          <span>
            Dobrodošli{" "}
            {currentUser?.email &&
              currentUser.email
                .split("@")[0]
                .split(".")
                .slice(0, 2)
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ")}{" "}
            !
          </span>

          <LogoutButton onClick={signOut}>Odjava</LogoutButton>
        </div>
      </Header>

      <Calendar />
      <ReservationForm />
    </DashboardContainer>
  );
};

export default Dashboard;
