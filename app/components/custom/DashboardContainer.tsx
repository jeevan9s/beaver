"use client";

import { useState } from "react";
import UploadButton from "./UploadButton";
import ReviewForm from "./ReviewForm";
import * as syllabus from "@/app/types/syllabus";

export default function DashboardContainer() {
  const [extractedData, setExtractedData] = useState<syllabus.Response | null>(null);

  return (
    <>
      {!extractedData ? (
        <UploadButton onExtracted={(data) => setExtractedData(data)} />
      ) : (
        <ReviewForm
          initialEvents={extractedData.events}
          filename={extractedData.filename}
          onReset={() => setExtractedData(null)}
          onSynced={() => setExtractedData(null)}
        />
      )}
    </>
  );
}