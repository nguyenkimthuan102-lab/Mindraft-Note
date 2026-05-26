import axiosClient from './axiosClient';

export interface Tag {
  id: string;
  name: string;
}

export const getTags = async () => {
  const response = await axiosClient.get(
    '/tags/list/'
  );

  return response.data.data;
};

export const createTag = async (
  name: string
) => {
  const response = await axiosClient.post(
    '/tags/',
    {
      name,
    }
  );

  return response.data;
};

export const updateTag = async (
  tagId: string,
  name: string
) => {
  const response = await axiosClient.patch(
    `/tags/${tagId}/`,
    {
      name,
    }
  );

  return response.data;
};

export const deleteTag = async (
  tagId: string
) => {
  const response = await axiosClient.delete(
    `/tags/${tagId}/delete/`
  );

  return response.data;
};

export const addTagToNote = async (
  noteId: string,
  tagId: string
) => {
  const response = await axiosClient.post(
    `/notes/${noteId}/tags/`,
    {
      tag_id: tagId,
    }
  );

  return response.data;
};

export const removeTagFromNote = async (
  noteId: string,
  tagId: string
) => {
  const response = await axiosClient.delete(
    `/notes/${noteId}/tags/${tagId}/`
  );

  return response.data;
};

export const getNoteTags = async (
  noteId: string
) => {
  const response = await axiosClient.get(
    `/notes/${noteId}/tags/list/`
  );

  return response.data.data;
};