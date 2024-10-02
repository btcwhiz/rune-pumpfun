import { useContext, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { MainContext } from "../contexts/MainContext";

const useSocket = () => {
  const { setUserInfo } = useContext(MainContext);
  const serverPath: string = `${process.env.NEXT_PUBLIC_API_URL}`;
  const socket: any = useRef(null);
  const [isConnected, setIsConnected] = useState(false); // Track connection state

  useEffect(() => {
    socket.current = io(serverPath);

    socket.current.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true); // Update connection state
    });

    socket.current.on("update-user-info", (userInfo: any) => {
      if (userInfo.user) {
        setUserInfo(userInfo.user);
      }
    });

    socket.current.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      socket.current.off("update-user-info");
      socket.current.disconnect();
    };
  }, [serverPath]);

  return { socket: socket.current, isConnected };
};

export default useSocket;
