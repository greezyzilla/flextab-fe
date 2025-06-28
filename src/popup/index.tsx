import { useState } from "react"
import "../../style.css"

function IndexPopup() {
  const [data, setData] = useState("")

  return (
    <div className="p-4 w-80 bg-white">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Welcome to{" "}
        <a
          href="https://www.plasmo.com"
          target="_blank"
          className="text-primary hover:text-blue-600 underline" rel="noreferrer"
        >
          FlexTab
        </a>{" "}
        Extension!
      </h2>
      <div className="mb-4">
        <input
          onChange={(e) => setData(e.target.value)}
          value={data}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Enter some text..."
        />
      </div>
      <a
        href="https://docs.plasmo.com"
        target="_blank"
        className="inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium" rel="noreferrer"
      >
        View Docs
      </a>
    </div>
  )
}

export default IndexPopup
