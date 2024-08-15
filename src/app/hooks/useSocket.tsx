import { useEffect, useRef } from "react";
import io from "socket.io-client";

const useSocket = () => {
  const serverPath: string = `${process.env.NEXT_PUBLIC_API_URL}`;
  const socket: any = useRef(null);

  useEffect(() => {
    socket.current = io(serverPath);

    socket.current.on("connect", () => {
      console.log("Connected to server");
    });

    socket.current.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      socket.current.disconnect();
    };
  }, [serverPath]);

  return socket.current;
};

export default useSocket;
