import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header/Header";
import ProfileSettings from "../components/ProfileSettings/ProfileSettings";
import { useEffect, useState } from "react";
import "../styles/Settings.css";
import { getMe } from "../api/authApi";


function Settings() {

    const [user, setUser] = useState(null);


    useEffect(() => {
        async function fetchUser() {
            try{
                const data = await getMe();
                console.log(data);
                setUser(data);
            } catch (error) {
            console.error("Error fetching user data:", error);
        }}
        fetchUser();
    }, []);


  return (
    <div className="settings-page">

      <Sidebar />

      <div className="settings-main">

        <Header />

        <div className="settings-content">
          <ProfileSettings
           user = {user}
           setUser = {setUser}
           />
           
        </div>

      </div>

    </div>
  );
}

export default Settings;