import { winstonLogger } from '@taylordurden/jobber-shared';
import { config } from '@auth/config';
import cloudinary, { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

export function getLogger(serviceName: string, level: string) {
  return winstonLogger(`${config.ELASTIC_SEARCH_URL}`, serviceName, level);
}

export function uploads(
  file: string,
  public_id?: string,
  overwrite?: boolean,
  invalidate?: boolean
): Promise<UploadApiResponse | UploadApiErrorResponse | undefined> {
  return new Promise((resolve) => {
    cloudinary.v2.uploader.upload(
      file,
      {
        public_id,
        overwrite,
        invalidate,
        resource_type: 'auto' // zip, images
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          resolve(error);
        }
        resolve(result);
      }
    );
  });
}
