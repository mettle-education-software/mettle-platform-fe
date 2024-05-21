export const fileTypes = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'image/png': 'PNG Image',
    'image/jpeg': 'JPEG Image',
    'image/gif': 'GIF Image',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'application/zip': 'ZIP',
    'application/x-rar-compressed': 'RAR',
    'application/octet-stream': 'Binary',
    'application/vnd.ms-excel': 'Excel',
    'application/msword': 'Word',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'text/plain': 'Text',
    'application/vnd.ms-outlook': 'Outlook',
    'application/vnd.ms-publisher': 'Publisher',
    'application/vnd.ms-visio.drawing': 'Visio',
    'application/vnd.ms-project': 'Project',
    'application/vnd.ms-access': 'Access',
};

export const fileExtensions = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/gif': 'gif',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/octet-stream': 'bin',
    'application/vnd.ms-excel': 'xls',
    'application/msword': 'doc',
    'application/vnd.ms-powerpoint': 'ppt',
    'text/plain': 'txt',
    'application/vnd.ms-outlook': 'pst',
    'application/vnd.ms-publisher': 'pub',
    'application/vnd.ms-visio.drawing': 'vsd',
    'application/vnd.ms-project': 'mpp',
    'application/vnd.ms-access': 'mdb',
};

export const saveFile = async (url: string, fileName: string, fileExtension: keyof typeof fileExtensions) => {
    const response = await fetch(url).then((res) => res.blob());
    const blob = new Blob([response], { type: fileExtension });
    const urlBlob = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlBlob;
    a.download = `${fileName}.${fileExtensions[fileExtension]}`;
    a.click();

    return true;
};
