import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export default function index(props: any) {
  const mutation = useMutation({
    mutationFn: async ({ u }: { u: string }) => {
      let resp = await axios.post("/tiktok/cak", {
        u: u,
      });
      const data = await resp.data;
      console.log(data);
      return data;
    },
  });
  return (
    <>
      <form
        className=""
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ u: e.target.u.value });
        }}
      >
        input:{" "}
        <input
          disabled={mutation.isPending}
          name="u"
          type="text"
          className="input"
        />
        <button className="btn">Search</button>
      </form>
    </>
  );
}
