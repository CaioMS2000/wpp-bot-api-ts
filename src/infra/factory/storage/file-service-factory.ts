import { R2FileService } from '@/infra/storage/cloudflare/r2-file-service'
import { FileService } from '@/infra/storage/file-service'
import {
	LocalFileService,
	Allowed as LocalFileServiceAllowedMedia,
} from '@/infra/storage/local/local-file-service'

export class FileServiceFactory {
	getService() {
		const service =
			// new LocalFileService() satisfies FileService<LocalFileServiceAllowedMedia>
			new R2FileService() satisfies FileService<LocalFileServiceAllowedMedia>

		return service
	}
}
