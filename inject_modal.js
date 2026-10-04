const fs = require('fs');
let code = fs.readFileSync('app/admin/page.js', 'utf8');

const modalUI = `
      {/* FARMER DETAILS MODAL */}
      {selectedFarmer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ zIndex: 10000 }}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 relative">
            <button 
              onClick={() => setSelectedFarmer(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold cursor-pointer"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedFarmer.full_name}</h2>
            <p className="text-gray-600 mb-6">{selectedFarmer.phone} | {selectedFarmer.village}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="text-sm text-green-800 font-semibold mb-1">Total Earnings</div>
                <div className="text-2xl font-bold text-green-700">₹{(selectedFarmerStats?.earnings || 0).toFixed(2)}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="text-sm text-blue-800 font-semibold mb-1">Total Commission Paid</div>
                <div className="text-2xl font-bold text-blue-700">₹{(selectedFarmerStats?.commission || 0).toFixed(2)}</div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-red-800 mb-3">Admin Actions</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Send Warning (Max 2)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={warningText} 
                    onChange={(e) => setWarningText(e.target.value)} 
                    placeholder="Enter warning message..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:border-red-500"
                  />
                  <button 
                    onClick={sendWarning}
                    disabled={(selectedFarmer.warnings || []).length >= 2}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
                  >
                    Send Warning
                  </button>
                </div>
                {selectedFarmer.warnings && selectedFarmer.warnings.length > 0 && (
                  <div className="mt-2 text-sm text-orange-800">
                    <strong>Previous Warnings:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      {selectedFarmer.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {!selectedFarmer.is_banned && (
                <button 
                  onClick={removeFarmer}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors mt-2 cursor-pointer"
                >
                  Remove Farmer completely
                </button>
              )}
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  "{activeSection === 'reviews' && (",
  modalUI + "\n{activeSection === 'reviews' && ("
);

fs.writeFileSync('app/admin/page.js', code);
console.log('Fixed injection');
