import { create } from "zustand";

interface MeetingState {
peerId:string|null;
roomId:string|null;
setRoomId: (id:string) => void;
setPeerId:(id:string) => void;
reset: ()=>void;
}

export const useMeetingStore = create<MeetingState>((set)=> ({
    peerId:null,
    roomId:null,
    setPeerId:(id)=> set({peerId:id}),
    setRoomId:(id)=> set({roomId:id}),
    reset:() => set({peerId:null ,roomId:null})
}));