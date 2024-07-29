import { Request, Response } from 'express';
import * as https from 'https';
import { IncomingMessage } from 'http';

// Function to decode Base64 encoded strings
const decodeBase64 = (data: string | null): string | null => {
  if (data) {
    return Buffer.from(data, 'base64').toString('utf8');
  }
  return null;
};

// Combined function to submit code and get the result
export const submitAndGetResult = async (req: Request, res: Response): Promise<void> => {
  const { sourceCode, languageId, stdin } = req.body;
  
  if (!sourceCode || !languageId) {
    res.status(400).json({ error: 'Source code and language ID are required' });
    return;
  }

  // Prepare the POST request to submit the code
  const postData = JSON.stringify({
    language_id: languageId,
    source_code: Buffer.from(sourceCode).toString('base64'),
    stdin: stdin ? Buffer.from(stdin).toString('base64') : ''
  });

  const submissionOptions: https.RequestOptions = {
    method: 'POST',
    hostname: 'judge0-ce.p.rapidapi.com',
    port: null,
    path: '/submissions?base64_encoded=true&wait=false&fields=*',
    headers: {
      'x-rapidapi-key': 'c246091d05msh325ef22e4b9e0a8p175969jsnd5d7b5c307b6',
      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
      'Content-Type': 'application/json'
    }
  };

  // Function to handle getting the result
  const getResult = (token: string): void => {
    const resultOptions: https.RequestOptions = {
      method: 'GET',
      hostname: 'judge0-ce.p.rapidapi.com',
      port: null,
      path: `/submissions/${token}?base64_encoded=true&fields=*`,
      headers: {
        'x-rapidapi-key': 'c246091d05msh325ef22e4b9e0a8p175969jsnd5d7b5c307b6',
        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
      }
    };

    const request = https.request(resultOptions, (response: IncomingMessage) => {
      const chunks: Uint8Array[] = [];

      response.on('data', (chunk: Uint8Array) => {
        chunks.push(chunk);
      });

      response.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        try {
          const resultJson = JSON.parse(body);
          // Decode Base64 encoded fields
          resultJson.stdout = decodeBase64(resultJson.stdout);
          resultJson.stderr = decodeBase64(resultJson.stderr);
          resultJson.source_code = decodeBase64(resultJson.source_code);

          res.json(resultJson); // Send the final result to the client
        } catch (error) {
          console.error('Error parsing result JSON:', error);
          res.status(500).json({ error: 'Error parsing result response JSON' });
        }
      });

      response.on('error', (error: Error) => {
        console.error('Result request error:', error);
        res.status(500).json({ error: `Result request error: ${error.message}` });
      });
    });

    request.end();
  };

  // Submit the code
  const submitRequest = https.request(submissionOptions, (response: IncomingMessage) => {
    const chunks: Uint8Array[] = [];

    response.on('data', (chunk: Uint8Array) => {
      chunks.push(chunk);
    });

    response.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      try {
        const submissionJson = JSON.parse(body);
        if (submissionJson.token) {
          // If token is received, get the result
          getResult(submissionJson.token);
        } else {
          res.status(500).json({ error: 'Token not received from submission' });
        }
      } catch (error) {
        console.error('Error parsing submission JSON:', error);
        res.status(500).json({ error: 'Error parsing submission response JSON' });
      }
    });

    response.on('error', (error: Error) => {
      console.error('Submission request error:', error);
      res.status(500).json({ error: `Submission request error: ${error.message}` });
    });
  });

  submitRequest.write(postData);
  submitRequest.end();
};
