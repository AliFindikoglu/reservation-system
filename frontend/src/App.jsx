import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import MyReservations from "./pages/MyReservations";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/my-reservations" element={<MyReservations />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;