const sendResponse = (
  res: any,
  status: number,
  message: string,
  data?: any,
) => {
  return res.status(status).json({
    message,
    data,
  });
};

export default sendResponse;
