const MAX_BYTES = 300 * 1024;
const MAX_DIMENSION = 800;
const MIN_DIMENSION = 320;
const START_QUALITY = 0.7;
const MIN_QUALITY = 0.35;

export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down if larger than max
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height / width) * MAX_DIMENSION);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width / height) * MAX_DIMENSION);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      const makeBlob = (quality: number) =>
        new Promise<Blob>((resolveBlob, rejectBlob) => {
          canvas.toBlob(
            (blob) => {
              if (blob) resolveBlob(blob);
              else rejectBlob(new Error("Failed to compress image"));
            },
            "image/jpeg",
            quality
          );
        });

      const compressToLimit = async () => {
        let currentWidth = width;
        let currentHeight = height;

        while (currentWidth >= MIN_DIMENSION && currentHeight >= MIN_DIMENSION) {
          for (let quality = START_QUALITY; quality >= MIN_QUALITY; quality -= 0.1) {
            const blob = await makeBlob(quality);
            if (blob.size <= MAX_BYTES) return blob;
          }

          currentWidth = Math.round(currentWidth * 0.85);
          currentHeight = Math.round(currentHeight * 0.85);
          canvas.width = currentWidth;
          canvas.height = currentHeight;
          ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
        }

        return makeBlob(MIN_QUALITY);
      };

      compressToLimit().then(resolve).catch(reject);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}
