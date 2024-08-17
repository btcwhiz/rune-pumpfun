import { useContext, useEffect, useRef } from "react";
import io from "socket.io-client";
import { MainContext } from "../contexts/MainContext";

const useSocket = () => {
  const { setUserInfo } = useContext(MainContext);
  const serverPath: string = `${process.env.NEXT_PUBLIC_API_URL}`;
  const socket: any = useRef(null);

  useEffect(() => {
    socket.current = io(serverPath);

    socket.current.on("connect", () => {
      console.log("Connected to server");
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

  return socket.current;
};

export default useSocket;
