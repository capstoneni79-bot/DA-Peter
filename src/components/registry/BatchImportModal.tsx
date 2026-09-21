import React, { useState } from 'react';
import { Download, Upload, X, CheckCircle, AlertTriangle, FileSpreadsheet, Eye, ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { Barangay, SwineRecord, UserAccount } from '../../types';
import { storageService } from '../../services/storageService';
import { isPointInsideHinunangan } from '../../utils/boundaryValidation';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  barangays: Barangay[];
  currentUser: UserAccount | null;
  onImportComplete: (count: number) => void;
}

interface RejectedImportRow {
  earTag: string;
  farmer: string;
  barangay: string;
  lat: number;
  lng: number;
  reason: string;
}

const SAMPLE_CSV = `EarTagNo,FarmerName,FarmerContact,Barangay,Breed,SwineType,WeightKg,AgeWeeks,ReadyToSell,EstimatedPricePhp,Latitude,Longitude
HN-LAB-2025-101,Pedro Balagao,0917-111-2233,Labrador,Landrace x Duroc,finisher,92.5,23,true,16200,10.3952,125.2104
HN-LAB-2025-102,Pedro Balagao,0917-111-2233,Labrador,Large White,finisher,88.0,22,true,15400,10.3954,125.2102
HN-POB-2025-103,Carmen Vasquez,0928-333-4455,Poblacion,Pietrain Hybrid,grower,52.0,15,false,9100,10.4035,125.2005
HN-CAN-2025-104,Danilo Oclarit,0919-555-6677,Canipaan,Landrace,finisher,96.0,24,true,16800,10.4280,125.2120`;

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  barangays,
  currentUser,
  onImportComplete,
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [parsedRecords, setParsedRecords] = useState<Partial<SwineRecord>[]>([]);
  const [rejectedRecords, setRejectedRecords] = useState<RejectedImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'DA_Hinunangan_Swine_Registry_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      setCsvContent(text);
      parseCsvData(text);
    };
    reader.readAsText(file);
  };

  const parseCsvData = (text: string) => {
    try {
      setParseError(null);
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        setParseError('CSV must have a header line and at least 1 record row.');
        setParsedRecords([]);
        setRejectedRecords([]);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const validRecords: Partial<SwineRecord>[] = [];
      const invalidRows: RejectedImportRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',').map(v => v.trim());

        const getVal = (colName: string) => {
          const idx = headers.indexOf(colName.toLowerCase());
          return idx !== -1 ? values[idx] : undefined;
        };

        const bgName = getVal('barangay') || (currentUser?.assignedBarangay || 'Poblacion');
        const bgObj = barangays.find(b => (b.name || '').toLowerCase() === (bgName || '').toLowerCase());

        const lat = parseFloat(getVal('latitude') || String(bgObj?.latitude || 10.4042));
        const lng = parseFloat(getVal('longitude') || String(bgObj?.longitude || 125.2017));
        const earTag = getVal('eartagno') || `HN-${(bgName || 'POB').substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${100 + i}`;
        const farmer = getVal('farmername') || 'Registered Raiser ' + i;

        // Strict Territorial Exclusivity Check
        if (!bgObj) {
          invalidRows.push({
            earTag,
            farmer,
            barangay: bgName,
            lat,
            lng,
            reason: `Barangay "${bgName}" is not among the 40 official barangays of Hinunangan.`,
          });
          continue;
        }

        if (!isPointInsideHinunangan(lat, lng)) {
          invalidRows.push({
            earTag,
            farmer,
            barangay: bgName,
            lat,
            lng,
            reason: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) are outside Hinunangan territory. Registrations from other provinces/municipalities are barred under EO 12-2023.`,
          });
          continue;
        }

        const rec: Partial<SwineRecord> = {
          id: 'swine-batch-' + Date.now() + '-' + i,
          earTagNo: earTag,
          farmerName: farmer,
          farmerContact: getVal('farmercontact') || '0900-000-0000',
          farmerAddress: `Brgy. ${bgName}, Hinunangan`,
          barangay: bgName,
          breed: getVal('breed') || 'Landrace Cross',
          swineType: (getVal('swinetype') as SwineRecord['swineType']) || 'finisher',
          weightKg: parseFloat(getVal('weightkg') || '85'),
          ageWeeks: parseInt(getVal('ageweeks') || '22', 10),
          readyToSell: getVal('readytosell')?.toLowerCase() === 'true',
          estimatedPricePhp: parseFloat(getVal('estimatedpricephp') || '15000'),
          latitude: lat,
          longitude: lng,
          status: getVal('readytosell')?.toLowerCase() === 'true' ? 'ready_to_sell' : 'healthy',
          photoUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
          biosecurity: {
            perimeterFence: true,
            footbathInstalled: true,
            disinfectionRoutine: true,
            quarantinePenAvailable: true,
            potableWaterSource: true,
            standardFeedStorage: true,
            asfVaccinationOrTesting: true,
            noSwillFeeding: true,
            visitorLogbook: true,
            wasteLagoonOrCompost: false,
          },
          registeredBy: currentUser?.name || 'Batch CSV Processor',
          registeredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isArchived: false,
        };

        validRecords.push(rec);
      }

      setParsedRecords(validRecords);
      setRejectedRecords(invalidRows);
    } catch (err: unknown) {
      setParseError('Failed to parse CSV: ' + (err instanceof Error ? err.message : String(err)));
      setParsedRecords([]);
      setRejectedRecords([]);
    }
  };

  const handleImport = () => {
    if (parsedRecords.length === 0) return;

    parsedRecords.forEach(rec => {
      storageService.addSwineRecord(rec as SwineRecord);
    });

    onImportComplete(parsedRecords.length);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-base">Batch Upload Swine & Farmer Registry</h3>
              <p className="text-xs text-emerald-200">Import multiple hog records from a CSV / Excel file</p>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-300 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Territorial Exclusivity Notice */}
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-emerald-950 text-xs">Territorial Exclusivity Notice</span>
                <span className="bg-emerald-200 text-emerald-850 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> EO 12-2023
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Every record must belong to one of Hinunangan's 40 barangays with pen coordinates strictly within the municipal boundary. Records from other provinces or municipalities are automatically rejected.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div>
              <span className="font-bold text-stone-800 text-sm block">CSV File Template</span>
              <p className="text-stone-500 text-xs">Need the proper format? Download our pre-configured CSV template.</p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="bg-white hover:bg-stone-100 text-emerald-800 font-semibold px-3 py-1.5 rounded-lg border border-emerald-600/40 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-700" /> Download Template (.CSV)
            </button>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-2">Upload CSV File</label>
            <div className="flex items-center gap-3">
              <label className="bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2 shadow-2xs transition">
                <Upload className="w-4 h-4" />
                <span>Select .CSV File</span>
                <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
              </label>
              <span className="text-stone-500">or paste CSV text below:</span>
            </div>
          </div>

          <div>
            <textarea
              rows={4}
              value={csvContent}
              onChange={e => {
                setCsvContent(e.target.value);
                parseCsvData(e.target.value);
              }}
              placeholder="EarTagNo,FarmerName,FarmerContact,Barangay,Breed,SwineType,WeightKg,AgeWeeks,ReadyToSell,EstimatedPricePhp,Latitude,Longitude..."
              className="w-full font-mono text-[11px] p-3 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {parseError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Rejected Out-of-Bounds Records */}
          {rejectedRecords.length > 0 && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-red-900 font-bold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Rejected {rejectedRecords.length} record(s) outside Hinunangan territory:</span>
              </div>
              <p className="text-[11px] text-red-800">
                The following entries cannot be registered because they are outside Hinunangan municipal boundaries or have invalid barangays:
              </p>
              <div className="max-h-32 overflow-y-auto divide-y divide-red-200 text-[10px]">
                {rejectedRecords.map((rj, idx) => (
                  <div key={idx} className="py-1.5 flex items-start justify-between gap-2">
                    <div>
                      <strong className="text-red-950">{rj.earTag}</strong> ({rj.farmer}, Brgy. {rj.barangay})
                      <div className="text-red-700">{rj.reason}</div>
                    </div>
                    <span className="bg-red-200 text-red-900 font-extrabold px-1.5 py-0.5 rounded text-[9px] shrink-0">
                      REJECTED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedRecords.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Verified Inside Hinunangan: {parsedRecords.length} record(s) ready to import:
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-stone-100 text-stone-700 font-semibold sticky top-0">
                    <tr>
                      <th className="p-2">Ear Tag</th>
                      <th className="p-2">Farmer</th>
                      <th className="p-2">Barangay</th>
                      <th className="p-2">Breed</th>
                      <th className="p-2">Weight</th>
                      <th className="p-2">Ready?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {parsedRecords.map((r, idx) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className="p-2 font-mono font-bold text-emerald-900">{r.earTagNo}</td>
                        <td className="p-2">{r.farmerName}</td>
                        <td className="p-2">{r.barangay}</td>
                        <td className="p-2 text-stone-500">{r.breed}</td>
                        <td className="p-2">{r.weightKg} kg</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.readyToSell ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'}`}>
                            {r.readyToSell ? 'YES' : 'NO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 p-4 border-t border-stone-200 flex items-center justify-end gap-3 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 font-semibold text-stone-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={parsedRecords.length === 0}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Confirm Import ({parsedRecords.length} Hinunangan Records)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
