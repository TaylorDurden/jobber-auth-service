import { getGigById, gigsSearch } from '@auth/services/search.service';
import { IPaginateProps, ISearchResult } from '@taylordurden/jobber-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sortBy } from 'lodash';

export async function gigs(req: Request, res: Response): Promise<void> {
  const { from, size, type } = req.params;
  const { query, delivery_time, minPrice, maxPrice } = req.query;
  let resultHits: unknown[] = [];
  const paginate: IPaginateProps = { from, size: parseInt(`${size}`), type };
  const gigs: ISearchResult = await gigsSearch(`${query}`, paginate, `${delivery_time}`, parseInt(`${minPrice}`), parseInt(`${maxPrice}`));
  for (const item of gigs.hits) {
    resultHits.push(item._source);
  }
  if (type === 'backward') {
    resultHits = sortBy(resultHits, ['sortId']);
  }
  res.status(StatusCodes.OK).json({ message: 'Search gigs results', total: gigs.total, gigs: resultHits });
}

export async function singleGigById(req: Request, res: Response): Promise<void> {
  const gig = await getGigById('gigs', req.params.gigId);
  res.status(StatusCodes.OK).json({ message: 'Single gig result', gig });
}
