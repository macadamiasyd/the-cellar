interface Area {
  x: number
  y: number
  width: number
  height: number
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = url
  })
}

export async function getCroppedImage(
  imageSrc: string,
  cropArea: Area,
  maxSize: number = 1200
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, maxSize / Math.max(cropArea.width, cropArea.height))
  canvas.width = Math.round(cropArea.width * scale)
  canvas.height = Math.round(cropArea.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    cropArea.x, cropArea.y, cropArea.width, cropArea.height,
    0, 0, canvas.width, canvas.height
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas blob failed')),
      'image/jpeg',
      0.85
    )
  })
}
