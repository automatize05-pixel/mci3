import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthGuard from "@/components/AuthGuard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import CreatePost from "./pages/CreatePost";
import Recipes from "./pages/Recipes";
import AIRecipes from "./pages/AIRecipes";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import UserProfile from "./pages/UserProfile";
import Search from "./pages/Search";
import DiscoverChefs from "./pages/DiscoverChefs";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/feed" element={<AuthGuard><Feed /></AuthGuard>} />
          <Route path="/create-post" element={<AuthGuard><CreatePost /></AuthGuard>} />
          <Route path="/recipes" element={<AuthGuard><Recipes /></AuthGuard>} />
          <Route path="/ai-recipes" element={<AuthGuard><AIRecipes /></AuthGuard>} />
          <Route path="/messages" element={<AuthGuard><Messages /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
          <Route path="/notifications" element={<AuthGuard><Notifications /></AuthGuard>} />
          <Route path="/user/:userId" element={<AuthGuard><UserProfile /></AuthGuard>} />
          <Route path="/search" element={<AuthGuard><Search /></AuthGuard>} />
          <Route path="/discover-chefs" element={<AuthGuard><DiscoverChefs /></AuthGuard>} />
          <Route path="/admin" element={<AuthGuard><Admin /></AuthGuard>} />
          <Route path="/analytics" element={<AuthGuard><Analytics /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
