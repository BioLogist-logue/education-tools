export async function downloadCertificate(element: HTMLElement) {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    useCORS: true,
  });

  const link = document.createElement("a");
  link.download = "certification.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
