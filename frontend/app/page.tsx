"use client";

import { useState, useRef } from "react";

export default function Dashboard() {

  const [ph, setPh] = useState("");
  const [traffic, setTraffic] = useState("");
  const [result, setResult] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [csvResult, setCsvResult] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --------------------------
  // SINGLE PREDICTION
  // --------------------------
  const handlePredict = async () => {

    if (!ph || !traffic) {
      alert("Please enter both values");
      return;
    }

    try {

      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ph: Number(ph),
          shipping_traffic: Number(traffic)
        })
      });

      const data = await response.json();

      setResult(data.prediction);

    } catch (error) {
      console.error(error);
      setResult("Error connecting to backend");
    }

  };

  // --------------------------
  // OPEN FILE EXPLORER
  // --------------------------
  const openFileExplorer = () => {
    fileInputRef.current?.click();
  };

  // --------------------------
  // FILE SELECTION
  // --------------------------
  const handleFileChange = (event: any) => {

    const selectedFile = event.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }

  };

  // --------------------------
  // CSV SUBMIT
  // --------------------------
  const handleCSVSubmit = async () => {

    if (!file) {
      alert("Please upload a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {

      const response = await fetch("http://127.0.0.1:8000/predict-csv", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      setCsvResult(JSON.stringify(data));

    } catch (error) {
      console.error(error);
      setCsvResult("CSV prediction failed");
    }

  };

  return (

    <div className="min-h-screen bg-blue-100">

      <header className="bg-blue-600 text-white text-center p-5 text-3xl font-bold">
        Ocean Acidity Prediction Dashboard
      </header>

      <main className="flex flex-col items-center mt-10">

        {/* SINGLE PREDICTION */}
        <div className="bg-white p-8 rounded shadow-md w-96 mb-10">

          <h2 className="text-xl font-bold mb-4">
            Single Prediction
          </h2>

          <label className="block mb-2">
            Ocean pH Level
          </label>

          <input
            type="text"
            value={ph}
            onChange={(e) => setPh(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="Enter pH value"
            className="border p-2 w-full mb-4"
          />

          <label className="block mb-2">
            Shipping Traffic
          </label>

          <input
            type="number"
            value={traffic}
            onChange={(e) => setTraffic(e.target.value)}
            className="border p-2 w-full mb-4"
          />

          <button
            onClick={handlePredict}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          >
            Predict
          </button>

          <div className="mt-4 font-semibold">
            Result: {result}
          </div>

        </div>


        {/* CSV UPLOAD */}
        <div className="bg-white p-8 rounded shadow-md w-96">

          <h2 className="text-xl font-bold mb-4">
            Batch Prediction (CSV)
          </h2>

          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <button
            onClick={openFileExplorer}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full mb-3"
          >
            Upload CSV
          </button>

          <div className="text-sm text-gray-700 mb-3">
            {fileName}
          </div>

          <button
            onClick={handleCSVSubmit}
            className="bg-green-500 text-white px-4 py-2 rounded w-full"
          >
            Submit CSV
          </button>

          <div className="mt-4 font-semibold">
            {csvResult}
          </div>

        </div>

      </main>

    </div>
  );
}


// "use client";

// import { useState, useRef } from "react";

// export default function Dashboard() {

//   const [ph, setPh] = useState("");
//   const [traffic, setTraffic] = useState("");
//   const [result, setResult] = useState("");

//   const [file, setFile] = useState<File | null>(null);
//   const [fileName, setFileName] = useState("");
//   const [csvResult, setCsvResult] = useState("");

//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // --------------------------
//   // Single Prediction
//   // --------------------------
//   const handlePredict = () => {

//     if (!ph || !traffic) {
//       alert("Please enter both values");
//       return;
//     }

//     // temporary result
//     setResult("Prediction Result will appear here");
//   };

//   // --------------------------
//   // Open File Explorer
//   // --------------------------
//   const openFileExplorer = () => {
//     fileInputRef.current?.click();
//   };

//   // --------------------------
//   // File Selection
//   // --------------------------
//   const handleFileChange = (event: any) => {

//     const selectedFile = event.target.files[0];

//     if (selectedFile) {
//       setFile(selectedFile);
//       setFileName(selectedFile.name);
//     }

//   };

//   // --------------------------
//   // CSV Submit
//   // --------------------------
//   const handleCSVSubmit = () => {

//     if (!file) {
//       alert("Please upload a CSV file");
//       return;
//     }

//     // temporary result
//     setCsvResult("CSV Prediction Completed");
//   };

//   return (

//     <div className="min-h-screen bg-blue-100">

//       {/* HEADER */}
//       <header className="bg-blue-600 text-white text-center p-5 text-3xl font-bold">
//         Ocean Acidity Prediction Dashboard
//       </header>

//       {/* MAIN SECTION */}
//       <main className="flex flex-col items-center mt-10">


//         {/* SINGLE PREDICTION FORM */}
//         <div className="bg-white p-8 rounded shadow-md w-96 mb-10">

//           <h2 className="text-xl font-bold mb-4">
//             Single Prediction
//           </h2>

//           {/* PH INPUT */}
//           <label className="block mb-2">
//             Ocean pH Level
//           </label>

//           <input
//           type="text"
//           value={ph}
//           onChange={(e) => setPh(e.target.value.replace(/[^0-9.]/g, ""))}
//           placeholder="Enter pH value"
//           className="border p-2 w-full mb-4"
// />


//           {/* TRAFFIC INPUT */}
//           <label className="block mb-2">
//             Shipping Traffic
//           </label>

//           <input
//             type="number"
//             value={traffic}
//             onChange={(e) => setTraffic(e.target.value)}
//             className="border p-2 w-full mb-4"
//           />


//           {/* PREDICT BUTTON */}
//           <button
//             onClick={handlePredict}
//             className="bg-blue-500 text-white px-4 py-2 rounded w-full"
//           >
//             Predict
//           </button>


//           {/* RESULT */}
//           <div className="mt-4 font-semibold">
//             Result: {result}
//           </div>

//         </div>


//         {/* CSV UPLOAD SECTION */}
//         <div className="bg-white p-8 rounded shadow-md w-96">

//           <h2 className="text-xl font-bold mb-4">
//             Batch Prediction (CSV)
//           </h2>

//           {/* Hidden file input */}
//           <input
//             type="file"
//             accept=".csv"
//             ref={fileInputRef}
//             onChange={handleFileChange}
//             style={{ display: "none" }}
//           />

//           {/* Upload Button */}
//           <button
//             onClick={openFileExplorer}
//             className="bg-blue-500 text-white px-4 py-2 rounded w-full mb-3"
//           >
//             Upload CSV
//           </button>


//           {/* Selected File Name */}
//           <div className="text-sm text-gray-700 mb-3">
//             {fileName}
//           </div>


//           {/* Submit CSV Button */}
//           <button
//             onClick={handleCSVSubmit}
//             className="bg-green-500 text-white px-4 py-2 rounded w-full"
//           >
//             Submit CSV
//           </button>


//           {/* CSV Result */}
//           <div className="mt-4 font-semibold">
//             {csvResult}
//           </div>

//         </div>

//       </main>

//     </div>
//   );
// }