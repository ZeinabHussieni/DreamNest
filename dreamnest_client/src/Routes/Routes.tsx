import React from "react";
import { Routes, Route } from "react-router-dom";
import RegisterForm from "../Pages/register/Register";
import LoginForm from "../Pages/login/Login";
import AppLayout from "../Components/shared/layout/AppLayout";
import HomePage from "../Pages/homePage/HomePage";
import UserGoals from "../Pages/userGoals/UserGoals";
import CreateGoal from "../Pages/createGoalPage/createGoalPage";
import GoalDetailsPage from "../Pages/goalsDetailsPage/GoalDetailsPage";
import Connections from "../Pages/connections/connections";
import ChatPage from "../Pages/chatPage/chatPage";
import UserPosts from "../Pages/userPosts/UserPosts";
import CommunityPosts from "../Pages/communityPosts/CommunityPosts";


const AppRoutes: React.FC = () => {
  return (
    <Routes>

      <Route path="/register" element={<RegisterForm />} />
      <Route path="/login" element={<LoginForm />} />

  
      <Route element={<AppLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/userGoals" element={<UserGoals />} />
      <Route path="/createGoalPage" element={<CreateGoal />} />
      <Route path="/goals/:id" element={<GoalDetailsPage />} />
      <Route path="/connections" element={<Connections />} />
      <Route path="/myposts" element={<UserPosts />} />
      <Route path="/posts" element={<CommunityPosts />} />
      
      </Route>
       <Route path="/chats" element={<ChatPage />} />
    </Routes>
  );
};

export default AppRoutes;
