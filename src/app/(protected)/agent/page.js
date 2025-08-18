"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { FiPlus } from "react-icons/fi";

const AgentPage = () => {
  return (
    <DashboardLayout>
     <div className="flex flex-col  h-screen">
      <div className="flex w-full justify-between items-center border-b border-[#EAECF0] pb-4 mb-4">
     <h1 className="text-2xl  font-semibold text-[#000000] ">
           Agent
          </h1>
          <button className="bg-[#101828] text-white px-4 py-2 cursor-pointer rounded-md flex items-center gap-2">
            <span>Add a new agent</span>
            <FiPlus className="w-4 h-4" />
          </button>
          </div>
          <div className="flex flex-col gap-4 items-center justify-center w-full mt-30"> 
            <img src='/dropbox.png' alt="agent" className="w-[160px] h-[160px]" />
            <h2 className="text-2xl font-semibold text-[#000000]">
              No agents Available
            </h2>
            <button className="border w-fit font-medium border-[#D0D5DD] cursor-pointer  bg-white text-[#101828] px-4 py-2 rounded-md flex items-center gap-2"> 
              <span>Add a new agent</span>
              <FiPlus className="w-4 h-4 font-bold" />
            </button>
           
          </div>
     </div>
    </DashboardLayout>
  );
};

export default AgentPage;
